import { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  InputBase, IconButton, Chip, TextField, Select, MenuItem, FormControl, InputLabel 
} from '@mui/material';

// Custom MEDX slate/teal Dark Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14b8a6', // Teal
    },
    background: {
      default: '#0a0c14',
      paper: '#0e111a',
    },
    text: {
      primary: '#f1f2f6',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid #1e293b',
          backgroundColor: '#0e111a',
        },
      },
    },
  },
});

function App() {
  const initialMessage = {
    sender: 'assistant',
    text: "👋 Welcome to MEDX AI. Please describe your symptoms in detail below, or choose one of the options to check hospital networks."
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSymptom, setActiveSymptom] = useState('');
  const [hospitalsList, setHospitalsList] = useState([]);
  
  // Track inline interaction states
  const [mapVisibleHospitalId, setMapVisibleHospitalId] = useState(null);
  const [bookingVisibleHospitalId, setBookingVisibleHospitalId] = useState(null);
  const [bookingForm, setBookingForm] = useState({ name: 'Debasis Mohanty', age: '23', gender: 'Male' });

  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, mapVisibleHospitalId, bookingVisibleHospitalId]);

  // Handle starter prompt click
  const handleSelectStarter = (starterText) => {
    sendUserQuery(starterText);
  };

  const handleSeveritySelect = (severity) => {
    sendUserQuery(severity);
  };

  // Main user query submission
  const sendUserQuery = (text) => {
    if (!text.trim()) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text: text }]);
    setIsTyping(true);
    setInputText('');

    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Check if we were waiting for a severity response
    if (activeSymptom && ['severe', 'moderate', 'mild', 'high', 'medium', 'low'].includes(lower)) {
      const severity = lower;
      
      setTimeout(async () => {
        let fetchedHospitals = [];
        const isSevere = ['severe', 'high'].includes(severity);
        const isMild = ['mild', 'low'].includes(severity);

        // Fetch from API
        try {
          const backendUrl = `http://localhost:8000/recommend?message=${encodeURIComponent(activeSymptom)}&lat=20.2800&lng=85.8000`;
          const response = await fetch(backendUrl, { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            fetchedHospitals = data.recommendations || [];
          }
        } catch (e) {
          console.log("Backend offline, falling back to mock data", e);
        }

        // Mock fallback if offline
        if (fetchedHospitals.length === 0) {
          fetchedHospitals = [
            {
              hospital_id: 1,
              name: 'AIIMS Bhubaneswar',
              hospital_name: 'AIIMS Bhubaneswar',
              distance_km: 4.2,
              distance: '4.2 km',
              travel_time_min: 12,
              duration: '12 mins',
              beds: 15,
              specialty: 'Trauma & Cardiac Care (Level 1)',
              coordinate: { lat: 20.2510, lng: 85.7766 }
            },
            {
              hospital_id: 2,
              name: 'Apollo Hospitals',
              hospital_name: 'Apollo Hospitals',
              distance_km: 5.8,
              distance: '5.8 km',
              travel_time_min: 15,
              duration: '15 mins',
              beds: 10,
              specialty: 'Multispecialty & General ER',
              coordinate: { lat: 20.3090, lng: 85.8327 }
            },
            {
              hospital_id: 3,
              name: 'Kalinga Hospital',
              hospital_name: 'Kalinga Hospital',
              distance_km: 6.2,
              distance: '6.2 km',
              travel_time_min: 16,
              duration: '16 mins',
              beds: 3,
              specialty: 'Pediatrics & Orthopedic Emergencies',
              coordinate: { lat: 20.3228, lng: 85.8160 }
            }
          ];
        }

        // Render Alert response
        if (isSevere) {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `🚨 Possible Medical Emergency\n\nSymptoms indicate immediate care is required. Please call emergency services or go to the nearest ER.`,
            isEmergency: true
          }]);
        } else if (isMild) {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `🟢 Mild Severity Matched\n\nSharing matching outpatient clinics and walk-in centers near you.`
          }]);
        } else {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `⚠️ Moderate Severity Logged\n\nSharing nearby urgent care wards and multi-specialty clinics.`
          }]);
        }

        // Render Hospital list response
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `Based on your symptoms, here are the nearest matched facilities:`,
            showHospitals: true,
            hospitals: fetchedHospitals
          }]);
          setHospitalsList(fetchedHospitals);
          setIsTyping(false);
        }, 800);

      }, 1000);
      return;
    }

    // 2. Otherwise match symptoms from input
    setTimeout(() => {
      let matched = null;

      if (lower.includes('chest') || lower.includes('pain') || lower.includes('heart')) {
        matched = 'Chest Pain';
      } else if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot')) {
        matched = 'Fever';
      } else if (lower.includes('breath') || lower.includes('lung') || lower.includes('chok')) {
        matched = 'Breathing Issue';
      } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('vehicle')) {
        matched = 'Accident';
      } else if (lower.includes('head') || lower.includes('brain') || lower.includes('concuss')) {
        matched = 'Head Injury';
      } else if (lower.includes('preg') || lower.includes('baby') || lower.includes('deliver')) {
        matched = 'Pregnancy';
      }

      if (matched) {
        setActiveSymptom(matched);
        setMessages((prev) => [...prev, {
          sender: 'assistant',
          text: `Got it — ${matched}. How severe is it?`,
          showSeverity: true
        }]);
      } else {
        setMessages((prev) => [...prev, {
          sender: 'assistant',
          text: `I've received your text: "${cleanText}". Could you please clarify if your symptom matches any of the starters or tell me if it is Mild, Moderate, or Severe?`
        }]);
      }
      setIsTyping(false);
    }, 1000);
  };

  // Submit Booking Inline
  const handleConfirmBooking = (hospital) => {
    setBookingVisibleHospitalId(null);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `✅ Pre-Admission Registration Completed!\n\n🏥 Facility: ${hospital.hospital_name || hospital.name}\n👤 Patient: ${bookingForm.name} (${bookingForm.age} / ${bookingForm.gender})\n🛡️ Wait Time Guideline: ${hospital.travel_time_min ? `${hospital.travel_time_min} mins ETA` : hospital.duration}\n\nWe have transmitted your clinical triage profile to the facility's reception deck. Please proceed to the ER ward upon arrival.`
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleNewChat = () => {
    setMessages([initialMessage]);
    setActiveSymptom('');
    setHospitalsList([]);
    setMapVisibleHospitalId(null);
    setBookingVisibleHospitalId(null);
  };

  const showStarters = messages.length === 1 && !isTyping;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">
        
        {/* Top Header */}
        <Box className="app-header">
          <Typography variant="h6" sx={{ fontWeight: '800', color: '#14b8a6', display: 'flex', alignItems: 'center', gap: 1 }}>
            🩺 MEDX
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleNewChat}
              sx={{ borderColor: '#1e293b', color: '#94a3b8', '&:hover': { borderColor: '#14b8a6', color: '#14b8a6' } }}
            >
              + New Chat
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1e293b', p: '6px 14px', borderRadius: 10, border: '1px solid #334155' }}>
              <span style={{ fontSize: '15px' }}>👤</span>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                Debasis
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Chat Area Workspace */}
        <Box className="chat-workspace">
          <Box className="chat-messages-scroll">
            <Box className="chat-messages-container">
              
              {/* Message List */}
              {messages.map((msg, index) => {
                const isAI = msg.sender === 'assistant';
                
                // 1. Render Special Emergency Alert Card inside list
                if (msg.isEmergency) {
                  return (
                    <Box key={index} className="emergency-alert-box">
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: '32px' }}>🚨</Typography>
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: '#ef4444', fontWeight: '900' }}>
                            Possible Medical Emergency Detected
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Your symptoms match guidelines requiring immediate clinical matching.
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="error" href="tel:108" sx={{ px: 3 }}>
                          📞 Call 108
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => {
                            // Find nearest hospital and trigger map display
                            if (hospitalsList.length > 0) {
                              setMapVisibleHospitalId(hospitalsList[0].hospital_id || 1);
                            }
                          }}
                          sx={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}
                        >
                          🚑 Nearest Hospital
                        </Button>
                        <Button variant="outlined" sx={{ borderColor: '#334155', color: '#94a3b8' }}>
                          📍 Share Location
                        </Button>
                      </Box>
                    </Box>
                  );
                }

                return (
                  <Box key={index} className={`msg-row ${isAI ? 'bot' : 'user'}`}>
                    <Typography className={`msg-label ${isAI ? 'bot' : 'user'}`}>
                      {isAI ? '🤖 MEDX' : '👤 You'}
                    </Typography>
                    
                    <Box className={`bubble ${isAI ? 'bot' : 'user'}`}>
                      <Typography variant="body1" sx={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </Typography>
                    </Box>

                    {/* Inline Severity Select buttons */}
                    {isAI && msg.showSeverity && index === messages.length - 1 && (
                      <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSeveritySelect('Mild')}
                          sx={{
                            borderColor: 'rgba(34, 197, 94, 0.4)',
                            bgcolor: 'rgba(34, 197, 94, 0.05)',
                            color: '#22c55e',
                            px: 2,
                            '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' }
                          }}
                        >
                          🟢 Mild
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSeveritySelect('Moderate')}
                          sx={{
                            borderColor: 'rgba(245, 158, 11, 0.4)',
                            bgcolor: 'rgba(245, 158, 11, 0.05)',
                            color: '#f59e0b',
                            px: 2,
                            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }
                          }}
                        >
                          🟡 Moderate
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSeveritySelect('Severe')}
                          sx={{
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            bgcolor: 'rgba(239, 68, 68, 0.05)',
                            color: '#ef4444',
                            px: 2,
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }
                          }}
                        >
                          🔴 Severe
                        </Button>
                      </Box>
                    )}

                    {/* Inline Hospital List Cards */}
                    {isAI && msg.showHospitals && msg.hospitals && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, width: '100%' }}>
                        {msg.hospitals.map((h) => {
                          const id = h.hospital_id || h.id || 1;
                          const showMap = mapVisibleHospitalId === id;
                          const showBooking = bookingVisibleHospitalId === id;
                          
                          const lat = h.latitude || h.coordinate?.lat || 20.2510;
                          const lng = h.longitude || h.coordinate?.lng || 85.7766;
                          const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015},${lat - 0.015},${lng + 0.015},${lat + 0.015}&layer=mapnik&marker=${lat},${lng}`;

                          return (
                            <Box key={h.name} sx={{ width: '100%' }}>
                              {/* Hospital Card */}
                              <Card sx={{ bgcolor: '#131924', border: '1px solid #1e293b' }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                      <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#f1f2f6' }}>
                                        {h.hospital_name || h.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {h.specialty || 'General Emergency Care'}
                                      </Typography>
                                    </Box>
                                    <Chip 
                                      label={`★ ${h.rating || '4.5'}`} 
                                      size="small" 
                                      sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 'bold' }} 
                                    />
                                  </Box>

                                  <Grid container spacing={2} sx={{ my: 1 }}>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Distance</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{h.distance || `${h.distance_km} km`}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Travel ETA</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#14b8a6' }}>{h.duration || `${h.travel_time_min} mins`}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Beds</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#22c55e' }}>{h.beds} available</Typography>
                                    </Grid>
                                  </Grid>

                                  <Divider sx={{ my: 1.5, borderColor: '#1e293b' }} />

                                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button 
                                      variant={showMap ? 'contained' : 'outlined'} 
                                      size="small" 
                                      onClick={() => setMapVisibleHospitalId(showMap ? null : id)}
                                      sx={{ borderColor: '#334155', color: showMap ? 'white' : '#94a3b8' }}
                                    >
                                      🗺️ {showMap ? 'Hide Map' : 'View on Map'}
                                    </Button>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => {
                                        setBookingVisibleHospitalId(showBooking ? null : id);
                                      }}
                                    >
                                      📅 Book Slot
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>

                              {/* Inline Dynamic Map View */}
                              {showMap && (
                                <Box className="inline-map-box" sx={{ mt: 1.5 }}>
                                  <iframe
                                    title={`Map for ${h.name}`}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    src={osmUrl}
                                    style={{ filter: 'hue-rotate(200deg) invert(90%) contrast(100%)' }}
                                  />
                                </Box>
                              )}

                              {/* Inline Dynamic Booking Form */}
                              {showBooking && (
                                <Card sx={{ mt: 1.5, bgcolor: '#0f131c', borderColor: '#14b8a6' }}>
                                  <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#14b8a6' }}>
                                      📅 Confirm Admission Booking: {h.hospital_name || h.name}
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Patient Full Name"
                                          size="small"
                                          fullWidth
                                          value={bookingForm.name}
                                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <TextField
                                          label="Age"
                                          size="small"
                                          fullWidth
                                          value={bookingForm.age}
                                          onChange={(e) => setBookingForm({ ...bookingForm, age: e.target.value })}
                                        />
                                      </Grid>
                                      <Grid item xs={6} sm={3}>
                                        <FormControl fullWidth size="small">
                                          <InputLabel>Gender</InputLabel>
                                          <Select
                                            value={bookingForm.gender}
                                            label="Gender"
                                            onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}
                                          >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </Grid>
                                    </Grid>
                                    
                                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
                                      <Button 
                                        variant="outlined" 
                                        size="small" 
                                        onClick={() => setBookingVisibleHospitalId(null)}
                                        sx={{ borderColor: '#334155', color: '#94a3b8' }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="contained" 
                                        size="small"
                                        onClick={() => handleConfirmBooking(h)}
                                      >
                                        Confirm Pre-Register
                                      </Button>
                                    </Box>
                                  </CardContent>
                                </Card>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Startup Screen when chat is empty */}
              {showStarters && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 4, gap: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: '900', color: '#f1f2f6', mb: 1 }}>
                      🩺 MEDX Healthcare Assistant
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                      Hi! Tell me what's happening today.
                    </Typography>
                  </Box>

                  {/* Prompt Starters */}
                  <Box className="starters-box">
                    <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#14b8a6', mb: 2 }}>
                      Example Prompts
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => handleSelectStarter("I have chest pain")}
                          sx={{ justifyContent: 'flex-start', color: '#f1f2f6', borderColor: '#1e293b', bgcolor: '#0a0c14', py: 1.5, px: 2, '&:hover': { borderColor: '#14b8a6' } }}
                        >
                          • I have chest pain
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => handleSelectStarter("Find nearby hospitals")}
                          sx={{ justifyContent: 'flex-start', color: '#f1f2f6', borderColor: '#1e293b', bgcolor: '#0a0c14', py: 1.5, px: 2, '&:hover': { borderColor: '#14b8a6' } }}
                        >
                          • Find nearby hospitals
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => handleSelectStarter("Book an appointment")}
                          sx={{ justifyContent: 'flex-start', color: '#f1f2f6', borderColor: '#1e293b', bgcolor: '#0a0c14', py: 1.5, px: 2, '&:hover': { borderColor: '#14b8a6' } }}
                        >
                          • Book an appointment
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={() => handleSelectStarter("I had a vehicle accident")}
                          sx={{ justifyContent: 'flex-start', color: '#f1f2f6', borderColor: '#1e293b', bgcolor: '#0a0c14', py: 1.5, px: 2, '&:hover': { borderColor: '#14b8a6' } }}
                        >
                          • Emergency help
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}

              {/* Typing Dot Animation */}
              {isTyping && (
                <Box className="msg-row bot">
                  <Typography className="msg-label bot">🤖 MEDX</Typography>
                  <Box sx={{ bgcolor: '#1b2234', color: '#94a3b8', borderRadius: '12px 12px 12px 2px', p: '12px 18px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                      MEDX is typing
                    </Typography>
                    <Box className="typing-dots" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <span className="dot">●</span>
                      <span className="dot" style={{ animationDelay: '0.2s' }}>●</span>
                      <span className="dot" style={{ animationDelay: '0.4s' }}>●</span>
                    </Box>
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          </Box>

          {/* Sticky Conversational Input Drawer */}
          <Box className="chat-bottom-area">
            <Box className="chat-input-wrapper">
              <span style={{ fontSize: '18px', cursor: 'pointer', opacity: 0.6 }} title="Voice Input">🎤</span>
              <span style={{ fontSize: '18px', cursor: 'pointer', opacity: 0.6 }} title="Attach File">📎</span>
              
              <InputBase
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendUserQuery(inputText);
                  }
                }}
                placeholder="Message MEDX..."
                fullWidth
                disabled={isTyping}
                sx={{ fontSize: '14px', py: 0.5, color: '#f1f2f6' }}
              />
              
              <IconButton 
                onClick={() => sendUserQuery(inputText)}
                disabled={!inputText.trim() || isTyping}
                sx={{ 
                  color: '#14b8a6',
                  '&.Mui-disabled': { color: '#475569' }
                }}
              >
                ➤
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
