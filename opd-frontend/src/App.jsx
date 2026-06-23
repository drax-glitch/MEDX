import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from './components/Sidebar';
import Consultation from './pages/Consultation';
import HospitalResults from './pages/HospitalResults';
import Booking from './pages/Booking';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';

// Custom MEDX slate/teal Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f172a', // slate-900
    },
    secondary: {
      main: '#14b8a6', // teal-500
    },
    success: {
      main: '#22c55e', // green-500
    },
    error: {
      main: '#ef4444', // red-500
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
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
      setSymptoms((prev) => [...prev, symptom]);
      let reply = `Got it. I have logged "${symptom}" into your pre-admission assessment profile.`;
      
      const isEmergency = ['Chest Pain', 'Breathing Issue', 'Accident', 'Head Injury'].includes(symptom);
      if (isEmergency) {
        reply += ` This matches high-severity emergency guidelines. I have prioritized trauma facility matching. Please view results to pre-register.`;
      } else {
        reply += ` This matches moderate urgent care guidelines. You can continue adding symptoms or proceed to match standard outpatient wards.`;
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleAddUserTextMessage = (text) => {
    // Append user input text bubble
    setMessages((prev) => [...prev, { sender: 'user', text: text }]);
    setIsTyping(true);

    setTimeout(() => {
      // Natural language keyword matching
      const lower = text.toLowerCase();
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

      let reply = '';
      if (matched) {
        if (!symptoms.includes(matched)) {
          setSymptoms((prev) => [...prev, matched]);
        }
        reply = `Based on your description, I have flagged and logged "${matched}" under your active symptom profile. I have recalculated your MEDX AI priority score. Please proceed to match recommended hospitals.`;
      } else {
        reply = `I have received and recorded your symptom logs: "${text}". Please select one of the Quick Triage Starter cards or provide further details so I can determine severity.`;
      }

      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleNewConsultation = () => {
    setSymptoms([]);
    setMessages([initialMessage]);
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
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            flexShrink: 0
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#64748b' }}>
              {currentTab === 'home' && '🏠 Home Dashboard'}
              {currentTab === 'consultation' && '💬 Consultation Workspace'}
              {currentTab === 'results' && '🏥 Hospital Recommendations'}
              {currentTab === 'booking' && '📅 Secure Admission Booking'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <span style={{ cursor: 'pointer', fontSize: '18px' }} title="Notifications">🔔</span>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '15px' }}>👤</span>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
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
                  <Typography variant="h4" sx={{ fontWeight: '800', color: '#0f172a', mb: 1 }}>
                    👋 Welcome back, Debasis
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Access real-time care routing network and clinical triage referrals.
                  </Typography>
                </Box>

                {/* Dashboard Stats */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#14b8a6', mb: 1 }}>
                          24/7
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                          Care Match Network
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Live hospital ER beds & wait time tracking active
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#22c55e', mb: 1 }}>
                          0
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                          Active Registrations
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          No pending ticket queues found on this profile
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: '900', color: '#64748b', mb: 1 }}>
                          0
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                          Prior Consultations
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Initiate a conversation to record diagnosis history
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Start consultation CTA */}
                <Box sx={{ mt: 2, p: 4, border: '1px dashed #cbd5e1', borderRadius: 4, bgcolor: '#ffffff', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a', mb: 1 }}>
                    Need medical priority check-in matching?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Describe symptoms to our AI agent to secure priority queues at AIIMS, Apollo, or Kalinga hospitals.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNewConsultation}
                    sx={{
                      bgcolor: '#14b8a6',
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
