import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from './components/Sidebar';
import Consultation from './pages/Consultation';
import HospitalResults from './pages/HospitalResults';
import Booking from './pages/Booking';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';

// Custom MEDX slate/teal Theme (Premium Dark Mode)
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14b8a6', // teal-500
    },
    secondary: {
      main: '#0a0c14', // dark-900
    },
    success: {
      main: '#22c55e', // green-500
    },
    error: {
      main: '#ef4444', // red-500
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
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: 'none',
          border: '1px solid #1e293b',
        },
      },
    },
  },
});


function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [symptoms, setSymptoms] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBookingHospital, setSelectedBookingHospital] = useState(null);

  const [showHospitals, setShowHospitals] = useState(false);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [activeSymptom, setActiveSymptom] = useState('');

  const initialMessage = {
    sender: 'assistant',
    text: "👋 Welcome to MEDX AI. Please describe your symptoms in detail below, or use the quick triage starters to check hospital networks."
  };
  const [messages, setMessages] = useState([initialMessage]);

  const handleSelectSymptom = (symptom) => {
    if (symptoms.includes(symptom)) return;
    
    setIsTyping(true);
    // Add user selection bubble immediately
    setMessages((prev) => [...prev, { sender: 'user', text: `I am experiencing ${symptom}.` }]);

    // Simulated medical triage processing delay
    setTimeout(() => {
      setActiveSymptom(symptom);
      let reply = `Got it — ${symptom}. How severe is it?`;
      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleAddUserTextMessage = async (text) => {
    // Append user input text bubble
    setMessages((prev) => [...prev, { sender: 'user', text: text }]);
    setIsTyping(true);

    const cleanText = text.trim();

    // Check if we are waiting for a severity response
    if (activeSymptom && ['severe', 'moderate', 'mild', 'high', 'medium', 'low'].includes(cleanText.toLowerCase())) {
      const severityInput = cleanText;
      
      setTimeout(async () => {
        let fetchedHospitals = [];
        const isSevere = ['severe', 'high'].includes(severityInput.toLowerCase());
        const isMild = ['mild', 'low'].includes(severityInput.toLowerCase());

        try {
          // Call real backend endpoint
          const backendUrl = `http://localhost:8000/recommend?message=${encodeURIComponent(activeSymptom)}&lat=20.2800&lng=85.8000`;
          const response = await fetch(backendUrl, { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            fetchedHospitals = data.recommendations || [];
          }
        } catch (e) {
          console.log("Backend offline, falling back to mock recommendations", e);
        }

        // Fallback mock hospitals if backend call failed or was offline
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

        // Add user symptom
        setSymptoms((prev) => {
          if (prev.includes(activeSymptom)) return prev;
          return [...prev, activeSymptom];
        });

        // 1. Add Alert response
        if (isSevere) {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `🚨 Critical Severity Detected\nThis sounds urgent. Sharing nearest hospitals now.`
          }]);
        } else if (isMild) {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `🟢 Mild Severity Detected\nSharing outpatient clinics near you.`
          }]);
        } else {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `⚠️ Moderate Severity Detected\nSharing urgent care centers near you.`
          }]);
        }

        // 2. Add Hospitals List header response
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `Top hospitals near Bhubaneswar for you:`
          }]);
          
          setHospitalsList(fetchedHospitals);
          setSelectedHospital(fetchedHospitals[0]);
          setShowHospitals(true);
          setIsTyping(false);
        }, 800);

      }, 1000);
      return;
    }

    setTimeout(() => {
      // Natural language keyword matching
      const lower = cleanText.toLowerCase();
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
        setMessages((prev) => [...prev, { sender: 'assistant', text: `Got it — ${matched}. How severe is it?` }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'assistant', text: `I have received and recorded your symptom logs: "${cleanText}". Please select one of the Quick Triage Starter cards or provide further details so I can determine severity.` }]);
      }
      setIsTyping(false);
    }, 1000);
  };

  const handleNewConsultation = () => {
    setSymptoms([]);
    setMessages([initialMessage]);
    setShowHospitals(false);
    setHospitalsList([]);
    setSelectedHospital(null);
    setActiveSymptom('');
    setCurrentTab('consultation');
  };

  const handleBookHospital = (hospital) => {
    setSelectedBookingHospital(hospital);
    setCurrentTab('booking');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="container">
        
        {/* Persistent 280px Left Sidebar */}
        <Sidebar
          onNewConsultation={handleNewConsultation}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        {/* Right workspace: Header + Content Router */}
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Top Profile Header (ChatGPT-Style) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0e111a',
            flexShrink: 0
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#94a3b8' }}>
              {currentTab === 'home' && '🏠 Home Dashboard'}
              {currentTab === 'consultation' && '💬 Consultation Workspace'}
              {currentTab === 'results' && '🏥 Hospital Recommendations'}
              {currentTab === 'booking' && '📅 Secure Admission Booking'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <span style={{ cursor: 'pointer', fontSize: '18px' }} title="Notifications">🔔</span>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1e293b', p: '6px 14px', borderRadius: 10, border: '1px solid #334155' }}>
                <span style={{ fontSize: '15px' }}>👤</span>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                  Debasis
                </Typography>
              </Box>
            </Box>
          </div>

          {/* Core Content Area */}
          <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
            
            {currentTab === 'home' && (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4, height: '100%', overflowY: 'auto' }}>
                {/* Greeting */}
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: '800', color: '#f1f2f6', mb: 1 }}>
                    👋 Welcome back, Debasis
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                    Access real-time care routing network and clinical triage referrals.
                  </Typography>
                </Box>

                {/* Dashboard Stats */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #1e293b', bgcolor: '#0e111a' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#14b8a6', mb: 1 }}>
                          24/7
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                          Care Match Network
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Live hospital ER beds & wait time tracking active
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #1e293b', bgcolor: '#0e111a' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#22c55e', mb: 1 }}>
                          0
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                          Active Registrations
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          No pending ticket queues found on this profile
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #1e293b', bgcolor: '#0e111a' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#94a3b8', mb: 1 }}>
                          0
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                          Prior Consultations
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Initiate a conversation to record diagnosis history
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Start consultation CTA */}
                <Box sx={{ mt: 2, p: 4, border: '1px dashed #334155', borderRadius: 4, bgcolor: '#0e111a', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: '800', color: '#f1f2f6', mb: 1 }}>
                    Need medical priority check-in matching?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                    Describe symptoms to our AI agent to secure priority queues at AIIMS, Apollo, or Kalinga hospitals.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNewConsultation}
                    sx={{
                      bgcolor: '#14b8a6',
                      color: 'white',
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      fontSize: '15px',
                      '&:hover': { bgcolor: '#0d9488' }
                    }}
                  >
                    Start Virtual Consultation
                  </Button>
                </Box>
              </Box>
            )}


            {currentTab === 'consultation' && (
              <Consultation
                messages={messages}
                symptoms={symptoms}
                onSelectSymptom={handleSelectSymptom}
                onFinishConsultation={() => setCurrentTab('results')}
                onAddUserTextMessage={handleAddUserTextMessage}
                isTyping={isTyping}
                showHospitals={showHospitals}
                hospitalsList={hospitalsList}
                selectedHospital={selectedHospital}
                onSelectHospital={setSelectedHospital}
              />
            )}

            {currentTab === 'results' && (
              <HospitalResults
                symptoms={symptoms}
                onBookHospital={handleBookHospital}
              />
            )}

            {currentTab === 'booking' && (
              <Booking
                symptoms={symptoms}
                hospital={selectedBookingHospital}
                onConfirmBooking={() => {}}
              />
            )}

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
