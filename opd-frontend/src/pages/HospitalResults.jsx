import { useState, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Rating, Grid, Alert, Divider } from '@mui/material';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import PatientSummary from '../components/PatientSummary';

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

const DEFAULT_CENTER = {
  lat: 20.2800,
  lng: 85.8000
};

function HospitalResults({ symptoms, onBookHospital }) {
  const [selectedHospital, setSelectedHospital] = useState(null);

  const hospitals = useMemo(() => [
    {
      id: 1,
      name: 'AIIMS Bhubaneswar',
      distance: '4.2 km',
      duration: '12 mins',
      waitTime: '15 mins',
      beds: 15,
      priorityScore: 96,
      rating: 4.8,
      specialty: 'Trauma & Cardiac Care (Level 1)',
      address: 'Sijua, Patrapada, Bhubaneswar',
      isBestForEmergency: true,
      coordinate: { lat: 20.2510, lng: 85.7766 },
      svgX: 180,
      svgY: 180,
      color: '#ef4444'
    },
    {
      id: 2,
      name: 'Apollo Hospitals',
      distance: '5.8 km',
      duration: '15 mins',
      waitTime: '30 mins',
      beds: 10,
      priorityScore: 84,
      rating: 4.6,
      specialty: 'Multispecialty & General ER',
      address: 'Samantapuri, Sainik School Road, Bhubaneswar',
      isBestForEmergency: false,
      coordinate: { lat: 20.3090, lng: 85.8327 },
      svgX: 420,
      svgY: 100,
      color: '#eab308'
    },
    {
      id: 3,
      name: 'Kalinga Hospital',
      distance: '6.2 km',
      duration: '16 mins',
      waitTime: '40 mins',
      beds: 3,
      priorityScore: 72,
      rating: 4.2,
      specialty: 'Pediatrics & Orthopedic Emergencies',
      address: 'Chandrasekharpur, Bhubaneswar',
      isBestForEmergency: false,
      coordinate: { lat: 20.3228, lng: 85.8160 },
      svgX: 380,
      svgY: 140,
      color: '#3b82f6'
    }
  ], []);

  const hasEmergency = symptoms.some(s => s === 'Chest Pain' || s === 'Breathing Issue' || s === 'Accident' || s === 'Head Injury');

  // Set default selected hospital
  useMemo(() => {
    if (!selectedHospital) {
      if (hasEmergency) {
        setSelectedHospital(hospitals[0]);
      } else {
        setSelectedHospital(hospitals[1]);
      }
    }
  }, [hasEmergency, hospitals, selectedHospital]);

  // Try to load Google Maps SDK
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      
      {/* Left Results Section (Map + List of Cards) */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', p: 3, gap: 3 }}>
        
        {/* Results Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a' }}>
              🏥 MATCHED FACILITIES & NAVIGATION
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Optimized emergency transit guidelines and trauma unit coordination
            </Typography>
          </Box>
        </Box>

        {/* Map Canvas Section (Top, Full Width) */}
        <Box
          sx={{
            height: '300px',
            bgcolor: '#0f172a',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {apiKey && isLoaded && !loadError ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={selectedHospital ? selectedHospital.coordinate : DEFAULT_CENTER}
              zoom={13}
            >
              {selectedHospital && (
                <MarkerF
                  position={selectedHospital.coordinate}
                  title={selectedHospital.name}
                />
              )}
            </GoogleMap>
          ) : (
            // Fallback Interactive Vector Map SVG
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="1" />
                  </linearGradient>
                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <pattern id="gridPattern" width="45" height="45" patternUnits="userSpaceOnUse">
                  <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* Road Layout */}
                <path d="M 40,80 L 520,80 L 520,280 M 40,180 L 520,180 M 260,30 L 260,290 M 80,240 L 480,240" 
                      fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />

                {/* Pulse routing connector */}
                {selectedHospital && (
                  <path
                    d={`M 260,180 Q 260,${selectedHospital.svgY} ${selectedHospital.svgX},${selectedHospital.svgY}`}
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    filter="url(#glowEffect)"
                    style={{
                      strokeDasharray: '8, 8',
                      animation: 'dashRoute 25s linear infinite'
                    }}
                  />
                )}

                {/* User Pin */}
                <circle cx="260" cy="180" r="8" fill="#14b8a6" />
                <circle cx="260" cy="180" r="16" fill="none" stroke="#14b8a6" strokeWidth="2" style={{ animation: 'pingEffect 2s infinite' }} />
                <text x="260" y="160" fill="#14b8a6" fontSize="11" fontWeight="bold" textAnchor="middle">You Are Here</text>

                {/* Hospital Pins */}
                {hospitals.map((h) => {
                  const isSelected = selectedHospital?.id === h.id;
                  return (
                    <g key={h.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedHospital(h)}>
                      {isSelected && (
                        <circle cx={h.svgX} cy={h.svgY} r="18" fill="none" stroke={h.color} strokeWidth="2" style={{ animation: 'pingEffect 2.5s infinite' }} />
                      )}
                      <circle cx={h.svgX} cy={h.svgY} r="7" fill={h.color} />
                      <text x={h.svgX} y={h.svgY - 12} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" 
                            style={{ paintOrder: 'stroke', stroke: '#0f172a', strokeWidth: '2.5px' }}>
                        {h.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <style>{`
                @keyframes dashRoute {
                  to { strokeDashoffset: -1000; }
                }
                @keyframes pingEffect {
                  0% { transform: scale(0.8); opacity: 1; transform-origin: center; }
                  100% { transform: scale(1.6); opacity: 0; transform-origin: center; }
                }
              `}</style>

              <Box sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(15, 23, 42, 0.9)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>ACTIVE ROUTE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', mt: 0.2 }}>
                  {selectedHospital ? `Route: Center → ${selectedHospital.name}` : 'Select a facility'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Recommended Hospitals List Section (Bottom) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569' }}>
            Recommended Hospitals (Sorted by Priority Match)
          </Typography>

          <Grid container spacing={2}>
            {hospitals.map((hospital) => {
              const isSelected = selectedHospital?.id === hospital.id;
              return (
                <Grid item xs={12} sm={6} md={4} key={hospital.id}>
                  <Card
                    onClick={() => setSelectedHospital(hospital)}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      transition: 'all 0.2s',
                      border: isSelected ? `2.5px solid ${hospital.color}` : '1px solid #e2e8f0',
                      boxShadow: isSelected ? '0 4px 12px rgba(15, 23, 42, 0.05)' : 'none',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                          {hospital.name}
                        </Typography>
                        <Chip
                          label={`Match: ${hospital.priorityScore}%`}
                          size="small"
                          sx={{
                            fontWeight: 'bold',
                            bgcolor: isSelected ? hospital.color : '#f1f5f9',
                            color: isSelected ? 'white' : '#475569',
                            fontSize: '11px'
                          }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {hospital.specialty}
                      </Typography>

                      <Divider />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          🚗 <strong>ETA:</strong> {hospital.duration} ({hospital.distance})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          🛏️ <strong>Beds Available:</strong> {hospital.beds}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          ⏱️ <strong>ER Wait Time:</strong> {hospital.waitTime}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookHospital(hospital);
                        }}
                        sx={{
                          mt: 1,
                          bgcolor: hospital.color,
                          color: 'white',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: hospital.color, opacity: 0.9 }
                        }}
                      >
                        Book Bed
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>

      {/* Right Column: Persistent Patient Summary */}
      <Box
        sx={{
          width: '320px',
          bgcolor: '#f8fafc',
          borderLeft: '1px solid #e2e8f0',
          padding: 3,
          overflowY: 'auto'
        }}
      >
        <PatientSummary symptoms={symptoms} currentView="results" />
      </Box>
    </Box>
  );
}

export default HospitalResults;
