import { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box, Typography, Button, Card, CardContent,
  InputBase, IconButton, Chip, Divider, CircularProgress
} from '@mui/material';

// React Icons — Lucide set via react-icons
import {
  MdLocalHospital,
  MdLocationOn,
  MdPhone,
  MdSend,
  MdAttachFile,
  MdMic,
  MdMoreVert,
  MdCheckCircle,
  MdWarning,
  MdFavorite,
  MdAccessTime,
  MdDirectionsCar,
  MdOpenInNew,
  MdPerson,
  MdMedicalServices,
  MdEmergency,
  MdThermostat,
  MdAdd,
  MdHotel,
  MdStar,
} from 'react-icons/md';
import { FaAmbulance, FaHeartbeat, FaUserMd, FaBed, FaRoute } from 'react-icons/fa';
import { TbStethoscope } from 'react-icons/tb';
import { LuBrain, LuActivity, LuZap } from 'react-icons/lu';

// Leaflet map
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons (webpack/vite asset issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom hospital marker (teal)
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// MUI Dark Theme
// ---------------------------------------------------------------------------
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#14b8a6' },
    background: { default: '#0a0c14', paper: '#0e111a' },
    text: { primary: '#f1f2f6', secondary: '#94a3b8' },
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif' },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getSeverityColor(severity) {
  if (!severity) return '#94a3b8';
  const s = severity.toLowerCase();
  if (s === 'critical') return '#ef4444';
  if (s === 'moderate') return '#f59e0b';
  return '#22c55e';
}

// Leaflet helper: fly to bounds when route changes
function MapFlyTo({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

// ---------------------------------------------------------------------------
// Leaflet Route Map component
// ---------------------------------------------------------------------------
function RouteMap({ userLocation, hospital }) {
  const userPos = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.2961, 85.8245];
  const hospPos = hospital?.coordinate
    ? [hospital.coordinate.lat || 20.2961, hospital.coordinate.lng || 85.8245]
    : [20.2961, 85.8245];

  const routePositions = [userPos, hospPos];
  const center = [
    (userPos[0] + hospPos[0]) / 2,
    (userPos[1] + hospPos[1]) / 2,
  ];

  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #1e293b', height: 240 }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0b0d14' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {/* User marker */}
        <Marker position={userPos}>
          <Popup>
            <strong>Your Location</strong>
          </Popup>
        </Marker>
        {/* Hospital marker */}
        <Marker position={hospPos} icon={hospitalIcon}>
          <Popup>
            <strong>{hospital?.hospital_name || 'Hospital'}</strong><br />
            {hospital?.specialty || 'General'}<br />
            {hospital?.distance_km?.toFixed(1)} km · {hospital?.travel_time_min} min ETA
          </Popup>
        </Marker>
        {/* Route line */}
        <Polyline
          positions={routePositions}
          pathOptions={{ color: '#14b8a6', weight: 3, dashArray: '8 6', opacity: 0.85 }}
        />
        <MapFlyTo positions={routePositions} />
      </MapContainer>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  const GREETING = {
    sender: 'assistant',
    text: "Hi! I'm MEDX. Describe your symptoms and I'll help you find the right care immediately.",
    time: now(),
  };

  const [messages, setMessages] = useState([GREETING]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [classification, setClassification] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ---------------------------------------------------------------------------
  // Geolocation — request once on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setUserLocation({ lat: 20.2961, lng: 85.8245 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
          .then((r) => r.json())
          .then((d) => {
            const addr = d.address || {};
            const label =
              addr.road || addr.suburb || addr.city_district || addr.city || 'Your Location';
            setLocationLabel(`${label}, ${addr.city || addr.town || 'Bhubaneswar'}`);
          })
          .catch(() => setLocationLabel('Your Location'));
      },
      () => {
        setLocationError(true);
        setUserLocation({ lat: 20.2961, lng: 85.8245 });
        setLocationLabel('Bhubaneswar (default)');
      }
    );
  }, []);

  // ---------------------------------------------------------------------------
  // API call to /chat
  // ---------------------------------------------------------------------------
  const callChatAPI = useCallback(
    async (message) => {
      const loc = userLocation || { lat: 20.2961, lng: 85.8245 };
      const body = { message, lat: loc.lat, lng: loc.lng, top_n: 3 };
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      return res.json();
    },
    [userLocation]
  );

  // ---------------------------------------------------------------------------
  // Message flow
  // ---------------------------------------------------------------------------
  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { ...msg, time: now() }]);

  const processUserMessage = async (text) => {
    addMessage({ sender: 'user', text });
    setIsTyping(true);

    try {
      const data = await callChatAPI(text);
      const cls = data.classification || {};
      const recs = data.recommendations || [];
      const isOffTopic = cls.off_topic;

      if (isOffTopic) {
        addMessage({
          sender: 'assistant',
          text: cls.message || data.response || "I can only help with health-related questions.",
        });
      } else {
        addMessage({ sender: 'assistant', text: data.response });

        if (cls.department && cls.department !== 'N/A') {
          setClassification(cls);
        }

        if (userLocation) {
          addMessage({
            sender: 'assistant',
            text: `Location detected: ${locationLabel || 'Bhubaneswar'}`,
            isLocation: true,
            coords: userLocation,
          });
        }

        if (recs.length > 0) {
          setHospitals(recs);
          setSelectedHospitalId(recs[0].hospital_id);
          addMessage({
            sender: 'assistant',
            text: `Found ${recs.length} hospital${recs.length > 1 ? 's' : ''} near you:`,
            isHospitalsHeader: true,
          });
        } else if (data.message) {
          addMessage({ sender: 'assistant', text: data.message });
        }
      }
    } catch (err) {
      addMessage({
        sender: 'assistant',
        text: 'Could not connect to the MEDX backend. Make sure the server is running on port 8000.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    processUserMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  const handleQuickAction = (text) => {
    if (text === 'Call ambulance') { window.location.href = 'tel:108'; return; }
    processUserMessage(text);
  };

  const handleNewChat = () => {
    setMessages([GREETING]);
    setHospitals([]);
    setSelectedHospitalId(null);
    setClassification(null);
  };

  const activeHospital = hospitals.find((h) => h.hospital_id === selectedHospitalId) || hospitals[0];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">

        {/* Header */}
        <Box className="medx-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box className="avatar bot" sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TbStethoscope size={20} color="#14b8a6" />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: '800', color: '#f1f2f6', lineHeight: 1.2 }}>
                MEDX Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', display: 'inline-block' }} />
                Online · Emergency ready
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {locationLabel && (
              <Chip
                icon={<MdLocationOn size={13} />}
                label={`${locationError ? 'Default — ' : ''}${locationLabel}`}
                size="small"
                sx={{ bgcolor: '#1b2234', color: '#94a3b8', fontSize: '11px', border: '1px solid #1e293b', '& .MuiChip-icon': { color: '#94a3b8' } }}
              />
            )}
            {classification && (
              <Chip
                icon={<MdMedicalServices size={13} />}
                label={`${classification.department} · ${classification.severity}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(239,68,68,0.08)',
                  color: getSeverityColor(classification.severity),
                  fontWeight: 'bold',
                  fontSize: '11px',
                  border: `1px solid ${getSeverityColor(classification.severity)}40`,
                  '& .MuiChip-icon': { color: getSeverityColor(classification.severity) },
                }}
              />
            )}

          </Box>
        </Box>

        {/* Workspace */}
        <Box className="medx-workspace">
          <Box className="medx-messages-scroll">
            <Box className="medx-messages-container">

              {messages.map((msg, index) => {
                const isAI = msg.sender === 'assistant';

                // Location pill
                if (msg.isLocation) {
                  return (
                    <Box key={index} className="location-card" sx={{ my: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <MdLocationOn size={22} color="#14b8a6" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: '800' }}>
                              {locationLabel || 'Your Location'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {msg.coords?.lat?.toFixed(4)}, {msg.coords?.lng?.toFixed(4)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={<MdCheckCircle size={12} />}
                          label="Confirmed"
                          size="small"
                          className="location-badge"
                          sx={{ '& .MuiChip-icon': { color: '#10b981' } }}
                        />
                      </Box>
                    </Box>
                  );
                }

                // Hospitals list + route map
                if (msg.isHospitalsHeader) {
                  return (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 1 }}>
                      <Box className="message-row bot">
                        <Box className="avatar bot" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TbStethoscope size={16} color="#14b8a6" />
                        </Box>
                        <Box className="message-bubble">
                          <Box className="bubble-content">
                            <Typography variant="body1" sx={{ fontSize: '14.5px', lineHeight: 1.5 }}>
                              {msg.text}
                            </Typography>
                          </Box>
                          <Typography className="message-meta">{msg.time}</Typography>
                        </Box>
                      </Box>

                      {/* Hospital cards */}
                      <Box className="hospitals-status-list">
                        {hospitals.map((h) => {
                          const isSelected = selectedHospitalId === h.hospital_id;
                          const score = Math.round((h.suitability_score || 0) * 100);
                          return (
                            <Box
                              key={h.hospital_id}
                              className={`hospital-status-row ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedHospitalId(h.hospital_id)}
                            >
                              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <MdLocalHospital size={22} color={isSelected ? '#10b981' : '#64748b'} />
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: '800' }}>
                                      {h.hospital_name}
                                    </Typography>
                                    <Chip
                                      label={`${score}% match`}
                                      size="small"
                                      sx={{
                                        height: '18px', fontSize: '10px', fontWeight: 'bold',
                                        bgcolor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#64748b',
                                        color: 'white',
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MdMedicalServices size={11} />
                                    {h.specialty || 'General'} &nbsp;·&nbsp;
                                    <MdDirectionsCar size={11} />
                                    {h.distance_km?.toFixed(1)} km &nbsp;·&nbsp;
                                    <MdAccessTime size={11} />
                                    {h.travel_time_min} min ETA
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: '800', color: '#10b981' }}>
                                  {h.travel_time_min} min
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.3, justifyContent: 'flex-end' }}>
                                  <FaBed size={10} /> {h.beds} beds
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Route card — Leaflet map */}
                      {activeHospital && (
                        <Box className="route-card">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FaRoute size={15} color="#14b8a6" />
                              <Typography variant="body2" sx={{ fontWeight: '800' }}>
                                Route to {activeHospital.hospital_name}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<MdOpenInNew size={13} />}
                              href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation?.lat},${userLocation?.lng};${activeHospital.coordinate?.lat || 20.2961},${activeHospital.coordinate?.lng || 85.8245}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ borderColor: '#334155', color: '#f1f2f6', textTransform: 'none', fontSize: '12px', px: 1.5, py: 0.4 }}
                            >
                              Open in OSM
                            </Button>
                          </Box>

                          {/* Distance / ETA strip */}
                          <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: '#0b0d14', px: 1.5, py: 0.8, borderRadius: 2, border: '1px solid #1e293b' }}>
                              <MdDirectionsCar size={15} color="#14b8a6" />
                              <Typography variant="caption" sx={{ fontWeight: '700', color: '#f1f2f6' }}>
                                {activeHospital.distance_km?.toFixed(1)} km via road
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: '#0b0d14', px: 1.5, py: 0.8, borderRadius: 2, border: '1px solid #1e293b' }}>
                              <MdAccessTime size={15} color="#14b8a6" />
                              <Typography variant="caption" sx={{ fontWeight: '700', color: '#f1f2f6' }}>
                                ~{activeHospital.travel_time_min} min ETA
                              </Typography>
                            </Box>
                          </Box>

                          {/* Live OSM map */}
                          <RouteMap userLocation={userLocation} hospital={activeHospital} />
                        </Box>
                      )}
                    </Box>
                  );
                }

                // Normal message bubble
                return (
                  <Box key={index} className={`message-row ${isAI ? 'bot' : 'user'}`}>
                    {isAI ? (
                      <Box className="avatar bot" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TbStethoscope size={16} color="#14b8a6" />
                      </Box>
                    ) : (
                      <Box sx={{ order: 2 }} className="avatar user">
                        <MdPerson size={16} color="#0e111a" />
                      </Box>
                    )}
                    <Box className="message-bubble">
                      <Box className="bubble-content">
                        <Typography variant="body1" sx={{ fontSize: '14.5px', lineHeight: 1.5 }}>
                          {msg.text}
                        </Typography>
                      </Box>
                      <Typography className="message-meta">{msg.time}</Typography>
                    </Box>
                  </Box>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <Box className="message-row bot">
                  <Box className="avatar bot" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TbStethoscope size={16} color="#14b8a6" />
                  </Box>
                  <Box sx={{
                    bgcolor: '#1b2234',
                    borderRadius: '12px 12px 12px 2px',
                    p: '14px 18px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2,
                    minWidth: '240px'
                  }}>
                    {[
                      { Icon: LuBrain, label: 'Analyzing symptoms', delay: '0s' },
                      { Icon: MdLocalHospital, label: 'Finding nearby hospitals', delay: '0.6s' },
                      { Icon: LuZap, label: 'Generating response', delay: '1.2s' },
                    ].map(({ Icon, label, delay }, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}
                        style={{ animation: `stepFadeIn 0.4s ease ${delay} forwards`, opacity: 0 }}
                      >
                        <Icon size={15} color="#94a3b8" />
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: '500', flex: 1, fontSize: '13px' }}>
                          {label}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          {[0, 1, 2].map((j) => (
                            <Box key={j} component="span" sx={{
                              width: 5, height: 5, borderRadius: '50%', bgcolor: '#14b8a6', display: 'inline-block',
                              animation: `spinnerPulse 1.1s infinite ease-in-out`,
                              animationDelay: `calc(${delay} + ${j * 0.15}s)`,
                            }} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          </Box>

          {/* Bottom input area */}
          <Box className="bottom-drawer">
            {/* Quick actions */}
            <Box className="quick-actions-row">
              <button className="quick-action-btn" onClick={() => handleQuickAction('Call ambulance')}>
                <FaAmbulance size={13} /> Call ambulance
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('I have chest pain and shortness of breath')}>
                <FaHeartbeat size={13} /> Chest pain
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('I have high fever and body aches')}>
                <MdThermostat size={14} /> Fever
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('I had an accident and need help')}>
                <MdEmergency size={14} /> Accident
              </button>
            </Box>

            {/* Input bar */}
            <Box className="chat-input-bar">

              <InputBase
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms or emergency..."
                fullWidth
                disabled={isTyping}
                sx={{ fontSize: '14.5px', py: 0.5, color: '#f1f2f6' }}
              />

              <IconButton
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                sx={{
                  bgcolor: '#14b8a6', color: 'white', width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  '&:hover': { bgcolor: '#0d9488' },
                  '&.Mui-disabled': { bgcolor: '#1e293b', color: '#475569' },
                }}
              >
                <MdSend size={15} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Keyframe styles */}
        <style>{`
          @keyframes stepFadeIn {
            from { opacity: 0; transform: translateX(-6px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes spinnerPulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40%            { transform: scale(1.0); opacity: 1; }
          }
          .leaflet-container {
            background: #0b0d14 !important;
          }
        `}</style>
      </Box>
    </ThemeProvider>
  );
}

export default App;
