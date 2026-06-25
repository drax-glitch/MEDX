import { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  InputBase, IconButton, Chip, Divider 
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
});

function App() {
  const initialMessages = [
    {
      sender: 'assistant',
      text: "Hi! I'm MEDX. Describe what's happening and I'll help you get the right care immediately.",
      time: '09:41 AM'
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: greeting, 1: symptom received, 2: severity received
  const [selectedHospitalId, setSelectedHospitalId] = useState(1); // 1: AIIMS, 2: Apollo, 3: Kalinga

  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    processUserMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const processUserMessage = (text) => {
    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text: text, time: '09:42 AM' }]);
    setIsTyping(true);

    // Simulated flow logic
    setTimeout(() => {
      if (activeStep === 0) {
        // Step 1: Emergency Detected + Ask Severity
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: 'Emergency detected. Trauma + possible head injury. Locating you now.',
            isAlert: true,
            time: '09:42 AM'
          },
          {
            sender: 'assistant',
            text: "This sounds serious. I've detected your emergency. How severe is your condition right now?",
            showSeverityChoices: true,
            time: '09:42 AM'
          }
        ]);
        setActiveStep(1);
      } else if (activeStep === 1) {
        // Step 2: Show Location + Hospitals Status + Route Graph
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: "Got it. I've detected your location automatically.",
            showLocation: true,
            time: '09:43 AM'
          },
          {
            sender: 'assistant',
            text: "Finding nearest emergency hospitals with trauma care...",
            showHospitalsList: true,
            time: '09:43 AM'
          },
          {
            sender: 'assistant',
            text: "Fastest route to AIIMS Bhubaneswar (4 min):",
            showRouteMap: true,
            time: '09:43 AM'
          }
        ]);
        setActiveStep(2);
      }
      setIsTyping(false);
    }, 1000);
  };

  const handleSelectSeverity = (severityLabel, userReplyText) => {
    // Append user bubble
    setMessages((prev) => [...prev, { sender: 'user', text: userReplyText, time: '09:42 AM' }]);
    setIsTyping(true);

    setTimeout(() => {
      // Show Location + Hospitals List + Route Card
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: "Got it. I've detected your location automatically.",
          showLocation: true,
          time: '09:43 AM'
        },
        {
          sender: 'assistant',
          text: "Finding nearest emergency hospitals with trauma care...",
          showHospitalsList: true,
          time: '09:43 AM'
        },
        {
          sender: 'assistant',
          text: "Fastest route to AIIMS Bhubaneswar (4 min):",
          showRouteMap: true,
          time: '09:43 AM'
        }
      ]);
      setActiveStep(2);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    if (action === 'Call ambulance') {
      window.location.href = 'tel:108';
    } else {
      processUserMessage(action);
    }
  };

  // Hospital definitions matching the screenshot
  const hospitals = [
    {
      id: 1,
      name: 'AIIMS Bhubaneswar',
      status: 'Open',
      statusColor: '#10b981',
      details: 'Trauma • Emergency • 2.4 km',
      time: '4 min',
      timeColor: '#10b981',
      route: 'NH-16 → Sijua → AIIMS Gate 1',
      routeDetails: '2.4 km - ~4 min - via NH-16',
      svgData: {
        land1: 'Patia Sq',
        land2: 'Sijua Rd',
        land3: 'NH-16 N',
        dest: 'AIIMS',
        etaColor: '#10b981'
      }
    },
    {
      id: 2,
      name: 'Apollo Hospitals',
      status: 'Open',
      statusColor: '#10b981',
      details: 'Emergency • Surgery • 3.1 km',
      time: '7 min',
      timeColor: '#94a3b8',
      route: 'NH-16 → Samantapuri → Apollo Gate 2',
      routeDetails: '3.1 km - ~7 min - via Sainik School Rd',
      svgData: {
        land1: 'Patia Sq',
        land2: 'VSS Nagar',
        land3: 'Sainik Sch',
        dest: 'Apollo',
        etaColor: '#94a3b8'
      }
    },
    {
      id: 3,
      name: 'Kalinga Hospital',
      status: 'Busy',
      statusColor: '#f59e0b',
      details: 'Emergency • 4.8 km',
      time: '11 min',
      timeColor: '#94a3b8',
      route: 'NH-16 → Damana → Kalinga Entrance',
      routeDetails: '4.8 km - ~11 min - via Damana Rd',
      svgData: {
        land1: 'Patia Sq',
        land2: 'Damana Sq',
        land3: 'C.Pur Rd',
        dest: 'Kalinga',
        etaColor: '#94a3b8'
      }
    }
  ];

  const activeHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  const handleNewChat = () => {
    setMessages(initialMessages);
    setActiveStep(0);
    setSelectedHospitalId(1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">
        
        {/* Top Header */}
        <Box className="medx-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box className="avatar bot" sx={{ width: 36, height: 36, fontSize: '18px' }}>🩺</Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: '800', color: '#f1f2f6', lineHeight: 1.2 }}>
                MEDX Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold', display: 'block' }}>
                ● Online • Emergency ready
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton href="tel:108" sx={{ color: '#94a3b8', hover: { color: 'white' } }}>
              📞
            </IconButton>
            <IconButton onClick={handleNewChat} sx={{ color: '#94a3b8', hover: { color: 'white' } }} title="Restart Triage">
              ⋮
            </IconButton>
          </Box>
        </Box>

        {/* Chat Area Workspace */}
        <Box className="medx-workspace">
          <Box className="medx-messages-scroll">
            <Box className="medx-messages-container">
              
              {/* Message List */}
              {messages.map((msg, index) => {
                const isAI = msg.sender === 'assistant';
                
                // 1. Render Special Red Alert Card inside list
                if (msg.isAlert) {
                  return (
                    <Box key={index} className="emergency-alert-card">
                      <Typography sx={{ fontSize: '18px', fontWeight: 'bold' }}>⚠️</Typography>
                      <Typography variant="body2" sx={{ fontWeight: '800', color: '#ef4444' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Box key={index} className={`message-row ${isAI ? 'bot' : 'user'}`}>
                    {/* Bot Doctor Icon / User Icon */}
                    {isAI ? (
                      <Box className="avatar bot">🩺</Box>
                    ) : (
                      <Box sx={{ order: 2 }} className="avatar user">D</Box>
                    )}
                    
                    <Box className="message-bubble">
                      <Box className="bubble-content">
                        <Typography variant="body1" sx={{ fontSize: '14.5px', lineHeight: 1.5 }}>
                          {msg.text}
                        </Typography>
                      </Box>
                      <Typography className="message-meta">
                        {msg.time}
                      </Typography>

                      {/* Inline Severity Select buttons */}
                      {isAI && msg.showSeverityChoices && index === messages.length - 1 && (
                        <Box className="severity-buttons-row">
                          <Button
                            variant="outlined"
                            className="severity-choice-btn"
                            onClick={() => handleSelectSeverity('Critical', "Critical — can't move")}
                            sx={{ color: '#ef4444', borderColor: '#1e293b', textTransform: 'none' }}
                          >
                            Critical — can't move
                          </Button>
                          <Button
                            variant="outlined"
                            className="severity-choice-btn"
                            onClick={() => handleSelectSeverity('Moderate', "Moderate, I'm conscious but bleeding badly.")}
                            sx={{ color: '#f59e0b', borderColor: '#1e293b', textTransform: 'none' }}
                          >
                            Moderate — conscious
                          </Button>
                          <Button
                            variant="outlined"
                            className="severity-choice-btn"
                            onClick={() => handleSelectSeverity('Mild', "Mild — stable")}
                            sx={{ color: '#22c55e', borderColor: '#1e293b', textTransform: 'none' }}
                          >
                            Mild — stable
                          </Button>
                        </Box>
                      )}

                      {/* Location Card */}
                      {isAI && msg.showLocation && (
                        <Box className="location-card">
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ fontSize: '20px' }}>📍</Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: '800' }}>
                                NH-16, Near Patia Square, Bhubaneswar
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Odisha • Lat 20.3521, Lng 85.8193
                              </Typography>
                            </Box>
                          </Box>
                          <Chip label="Confirmed" size="small" className="location-badge" />
                        </Box>
                      )}

                      {/* Hospital Status Rows Card */}
                      {isAI && msg.showHospitalsList && (
                        <Box className="hospitals-status-list">
                          {hospitals.map((h) => {
                            const isSelected = selectedHospitalId === h.id;
                            return (
                              <Box 
                                key={h.id} 
                                className={`hospital-status-row ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedHospitalId(h.id)}
                              >
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                  <Box sx={{ fontSize: '20px', color: isSelected ? '#10b981' : '#94a3b8' }}>🏥</Box>
                                  <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: '800' }}>
                                        {h.name}
                                      </Typography>
                                      <Chip 
                                        label={h.status} 
                                        size="small" 
                                        sx={{ 
                                          height: '18px', 
                                          fontSize: '10px', 
                                          fontWeight: 'bold', 
                                          bgcolor: h.statusColor, 
                                          color: 'white' 
                                        }} 
                                      />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                      {h.details}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: '800', color: h.timeColor }}>
                                  {h.time}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      {/* SVG Routing Map Card */}
                      {isAI && msg.showRouteMap && (
                        <Box className="route-card">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: '800' }}>
                              Fastest route to {activeHospital.name} ({activeHospital.time}):
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0b0d14', p: 2, borderRadius: 2, border: '1px solid #1e293b', mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: '800', color: '#f1f2f6' }}>
                              🛣️ {activeHospital.route}
                            </Typography>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${activeHospital.name}`}
                              target="_blank"
                              sx={{ borderColor: '#334155', color: '#f1f2f6', textTransform: 'none', px: 2, py: 0.5 }}
                            >
                              Open Maps
                            </Button>
                          </Box>

                          {/* Dynamic SVG Timeline Map */}
                          <Box sx={{ bgcolor: '#0b0d14', p: 2, borderRadius: 2, border: '1px solid #1e293b' }}>
                            <svg width="100%" height="80" viewBox="0 0 560 80">
                              {/* Connector line */}
                              <line x1="40" y1="35" x2="520" y2="35" stroke="#10b981" strokeWidth="3" strokeDasharray="6,6" />
                              
                              {/* You red node */}
                              <circle cx="40" cy="35" r="8" fill="#ef4444" />
                              <text x="40" y="16" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">You</text>
                              
                              {/* Landmark 1 */}
                              <rect x="100" y="23" width="75" height="24" rx="4" fill="#161a24" stroke="#1e293b" />
                              <text x="137.5" y="39" fill="#94a3b8" fontSize="9" textAnchor="middle">{activeHospital.svgData.land1}</text>
                              
                              {/* Landmark 2 */}
                              <rect x="220" y="23" width="75" height="24" rx="4" fill="#161a24" stroke="#1e293b" />
                              <text x="257.5" y="39" fill="#94a3b8" fontSize="9" textAnchor="middle">{activeHospital.svgData.land2}</text>
                              
                              {/* Landmark 3 */}
                              <rect x="340" y="23" width="75" height="24" rx="4" fill="#161a24" stroke="#1e293b" />
                              <text x="377.5" y="39" fill="#94a3b8" fontSize="9" textAnchor="middle">{activeHospital.svgData.land3}</text>
                              
                              {/* Hospital Green node */}
                              <circle cx="520" cy="35" r="10" fill="#10b981" />
                              <text x="520" y="35" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="central">H</text>
                              <text x="520" y="16" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">{activeHospital.svgData.dest}</text>
                              
                              {/* Routing metadata text */}
                              <text x="280" y="70" fill="#14b8a6" fontSize="11" fontWeight="bold" textAnchor="middle">
                                {activeHospital.routeDetails}
                              </text>
                            </svg>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}

              {/* Loader/Hospital alert animation */}
              {activeStep === 2 && !isTyping && (
                <Box className="message-row bot" sx={{ mt: 1 }}>
                  <Box className="avatar bot">🩺</Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                    <Box className="loader-dots">
                      <span className="dot"></span>
                      <span className="dot" style={{ animationDelay: '0.2s' }}></span>
                      <span className="dot" style={{ animationDelay: '0.4s' }}></span>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Alerting hospital...
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Typing Dot Animation */}
              {isTyping && (
                <Box className="message-row bot">
                  <Box className="avatar bot">🩺</Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                    <Box className="loader-dots">
                      <span className="dot"></span>
                      <span className="dot" style={{ animationDelay: '0.2s' }}></span>
                      <span className="dot" style={{ animationDelay: '0.4s' }}></span>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      MEDX is typing
                    </Typography>
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>
          </Box>

          {/* Sticky Conversational Input & Quick Actions */}
          <Box className="bottom-drawer">
            {/* Quick Actions */}
            <Box className="quick-actions-row">
              <button className="quick-action-btn" onClick={() => handleQuickAction('Call ambulance')}>
                📞 Call ambulance
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('Share live location')}>
                📍 Share live location
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('Contact family')}>
                👥 Contact family
              </button>
              <button className="quick-action-btn" onClick={() => handleQuickAction('Call hospital')}>
                🏥 Call hospital
              </button>
            </Box>

            {/* Message input */}
            <Box className="chat-input-bar">
              <span style={{ fontSize: '18px', cursor: 'pointer', opacity: 0.6 }} title="Attach File">📎</span>
              <InputBase
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your emergency..."
                fullWidth
                disabled={isTyping}
                sx={{ fontSize: '14.5px', py: 0.5, color: '#f1f2f6' }}
              />
              <span style={{ fontSize: '18px', cursor: 'pointer', opacity: 0.6 }} title="Voice Input">🎤</span>
              
              <IconButton 
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                sx={{ 
                  bgcolor: '#14b8a6',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  '&:hover': { bgcolor: '#0d9488' },
                  '&.Mui-disabled': { bgcolor: '#1e293b', color: '#475569' }
                }}
              >
                ↑
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
