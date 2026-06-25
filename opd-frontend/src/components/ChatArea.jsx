import { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, IconButton, InputBase, Grid, Chip, Divider } from '@mui/material';
import { MdLocalHospital, MdSend, MdFavorite, MdThermostat, MdEmergency, MdMedicalServices, MdCheckCircle, MdPerson, MdWarning } from 'react-icons/md';
import { FaAmbulance, FaHeartbeat, FaBed, FaLungs, FaBrain } from 'react-icons/fa';
import { TbStethoscope } from 'react-icons/tb';
import { LuBrain, LuZap } from 'react-icons/lu';
import { GiPill } from 'react-icons/gi';


function ChatArea({
  messages,
  onSelectSymptom,
  onFinishConsultation,
  onAddUserTextMessage,
  isTyping,
  showHospitals,
  hospitalsList = [],
  selectedHospital,
  onSelectHospital
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Automatic scroll-to-bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onAddUserTextMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSeveritySelect = (severity) => {
    onAddUserTextMessage(severity);
  };

  const quickSymptoms = [
    { label: 'Chest Pain', Icon: FaHeartbeat, value: 'Chest Pain', color: '#ef4444' },
    { label: 'Fever', Icon: MdThermostat, value: 'Fever', color: '#f59e0b' },
    { label: 'Breathing Issue', Icon: FaLungs, value: 'Breathing Issue', color: '#8b5cf6' },
    { label: 'Accident', Icon: FaAmbulance, value: 'Accident', color: '#3b82f6' },
    { label: 'Head Injury', Icon: FaBrain, value: 'Head Injury', color: '#e11d48' },
    { label: 'Pregnancy', Icon: MdMedicalServices, value: 'Pregnancy', color: '#ec4899' },
  ];

  // Welcome state is when there's only the start greeting
  const showStarters = messages.length === 1 && !isTyping;

  return (
    <Box className="chat-container">
      {/* Network Status Header */}
      <Box 
        sx={{ 
          p: '16px 24px', 
          borderBottom: '1px solid #1e293b', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#0e111a'
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#f1f2f6', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TbStethoscope size={20} color="#14b8a6" /> MEDX Consultation Room
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            AI Triage Engine Active
          </Typography>
        </Box>
        <Box 
          sx={{ 
            bgcolor: 'rgba(34, 197, 94, 0.08)', 
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 20, 
            px: 1.8, 
            py: 0.5 
          }}
        >
          <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            ● Connected to Hospital Network
          </Typography>
        </Box>
      </Box>

      {/* Messages Scroll Area */}
      <Box className="messages-list">
        
        {/* Render Chat Messages */}
        {messages.map((msg, index) => {
          const isAI = msg.sender === 'assistant';
          const isLastAI = isAI && index === messages.length - 1;
          const isEmergencyAlert = isAI && msg.text.includes("Critical Severity Detected");
          const isHospitalsHeader = isAI && msg.text.includes("Top hospitals near Bhubaneswar");

          // Render Emergency Alert style specifically
          if (isEmergencyAlert) {
            return (
              <Box
                key={index}
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 3,
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                  mb: 1
                }}
                className="glow-emergency"
              >
                <Box sx={{ fontSize: '32px', display: 'flex', alignItems: 'center' }}><MdEmergency color="#ef4444" /></Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#ef4444', fontWeight: '800', fontSize: '15px' }}>
                    Critical Severity Detected
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                    This sounds urgent. Sharing nearest emergency facilities now.
                  </Typography>
                </Box>
              </Box>
            );
          }

          return (
            <Box
              key={index}
              sx={{
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8
              }}
            >
              {/* Sender label for AI */}
              {isAI && (
                <Typography variant="caption" sx={{ color: '#14b8a6', fontWeight: 'bold', pl: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TbStethoscope size={16} /> MEDX AI
                </Typography>
              )}
              
              {/* Message Content Bubble */}
              <Box
                sx={{
                  bgcolor: isAI ? '#1b2234' : '#14b8a6',
                  color: '#f1f2f6',
                  borderRadius: isAI ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  p: '12px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: isAI ? '1px solid #1e293b' : 'none'
                }}
              >
                <Typography variant="body1" sx={{ fontSize: '14.5px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>
              </Box>

              {/* Severity Quick Buttons inline in chat */}
              {isLastAI && msg.text.includes("How severe is it?") && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1, pl: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSeveritySelect('Mild')}
                    sx={{
                      borderColor: 'rgba(34, 197, 94, 0.4)',
                      bgcolor: 'rgba(34, 197, 94, 0.05)',
                      color: '#22c55e',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      px: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' }
                    }}
                  >
                    <MdCheckCircle style={{ marginRight: '4px' }} /> Mild
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSeveritySelect('Moderate')}
                    sx={{
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      bgcolor: 'rgba(245, 158, 11, 0.05)',
                      color: '#f59e0b',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      px: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }
                    }}
                  >
                    <MdWarning style={{ marginRight: '4px' }} /> Moderate
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSeveritySelect('Severe')}
                    sx={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      bgcolor: 'rgba(239, 68, 68, 0.05)',
                      color: '#ef4444',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      px: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }
                    }}
                  >
                    <MdEmergency style={{ marginRight: '4px' }} /> Severe
                  </Button>
                </Box>
              )}

              {/* Inline Interactive Hospital Cards in Chat */}
              {isHospitalsHeader && showHospitals && hospitalsList.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5, width: '100%' }}>
                  {hospitalsList.map((h) => {
                    // Check if selected
                    const isSelected = selectedHospital && (selectedHospital.hospital_id === h.hospital_id || selectedHospital.id === h.id || selectedHospital.hospital_name === h.hospital_name || selectedHospital.name === h.name);
                    const bedCount = h.beds || 0;
                    const travelTime = h.travel_time_min || parseInt(h.duration) || 0;
                    const dist = h.distance_km || parseFloat(h.distance) || 0;
                    const color = h.color || (h.suitability_score > 0.85 ? '#ef4444' : '#14b8a6');

                    return (
                      <Card
                        key={h.hospital_name || h.name}
                        onClick={() => onSelectHospital(h)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: '#131924',
                          border: isSelected ? `2.5px solid #14b8a6` : '1px solid #1e293b',
                          boxShadow: isSelected ? '0 0 12px rgba(20, 184, 166, 0.25)' : 'none',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: isSelected ? '#14b8a6' : '#334155'
                          }
                        }}
                      >
                        <CardContent sx={{ p: '16px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ fontSize: '24px', bgcolor: 'rgba(20, 184, 166, 0.08)', p: 1, borderRadius: 2, border: '1px solid #1e293b', display: 'flex', alignItems: 'center' }}>
                              <MdLocalHospital color="#14b8a6" />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: '800', color: '#f1f2f6' }}>
                                {h.hospital_name || h.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.2 }}>
                                {dist} km • {travelTime} mins • {h.specialty || 'General ER'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Chip
                              label={`${bedCount} beds`}
                              size="small"
                              sx={{
                                fontWeight: '800',
                                bgcolor: bedCount > 8 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: bedCount > 8 ? '#22c55e' : '#f59e0b',
                                fontSize: '11px',
                                border: `1px solid ${bedCount > 8 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
                              {travelTime} mins
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}

        {/* Animated Pipeline Loading Indicator */}
        {isTyping && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#14b8a6', fontWeight: 'bold', pl: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TbStethoscope size={16} /> MEDX AI
            </Typography>
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
                { icon: <LuBrain size={18} />, label: 'Analyzing symptoms', delay: '0s' },
                { icon: <MdLocalHospital size={18} />, label: 'Finding nearby hospitals', delay: '0.6s' },
                { icon: <LuZap size={18} />, label: 'Generating response', delay: '1.2s' },
              ].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}
                  className={`pipeline-step pipeline-step-${i}`}
                  style={{ animationDelay: step.delay }}
                >
                  <Box sx={{ fontSize: '15px', opacity: 0.9, display: 'flex', alignItems: 'center' }}>{step.icon}</Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: '500', flex: 1, fontSize: '13px' }}>
                    {step.label}
                  </Typography>
                  <Box className="step-spinner" style={{ animationDelay: step.delay }}>
                    <span className="spinner-dot" style={{ animationDelay: step.delay }}></span>
                    <span className="spinner-dot" style={{ animationDelay: `calc(${step.delay} + 0.15s)` }}></span>
                    <span className="spinner-dot" style={{ animationDelay: `calc(${step.delay} + 0.30s)` }}></span>
                  </Box>
                </Box>
              ))}
            </Box>

            <style>{`
              .pipeline-step {
                animation: stepFadeIn 0.4s ease forwards;
                opacity: 0;
              }
              @keyframes stepFadeIn {
                from { opacity: 0; transform: translateX(-6px); }
                to   { opacity: 1; transform: translateX(0); }
              }
              .step-spinner {
                display: flex;
                gap: 3px;
                align-items: center;
              }
              .spinner-dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: #14b8a6;
                display: inline-block;
                animation: spinnerPulse 1.1s infinite ease-in-out;
              }
              @keyframes spinnerPulse {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                40%            { transform: scale(1.0); opacity: 1; }
              }
            `}</style>
          </Box>
        )}

        {/* Welcome Grid Symptom Starters */}
        {showStarters && (
          <Box sx={{ mt: 2, border: '1px dashed #334155', borderRadius: 3, p: 3, bgcolor: '#0e111a' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#f1f2f6', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LuZap color="#f59e0b" /> Quick Triage Starters
              </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
              Choose a quick symptom card below to initiate diagnostic matching:
            </Typography>

            <Grid container spacing={2}>
              {quickSymptoms.map((item) => (
                <Grid item xs={6} sm={4} key={item.value}>
                  <Card
                    onClick={() => onSelectSymptom(item.value)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: '#0a0c14',
                      border: '1px solid #1e293b',
                      transition: 'all 0.2s',
                      boxShadow: 'none',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.1)',
                        borderColor: item.color,
                        bgcolor: 'rgba(20, 184, 166, 0.04)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        {item.icon}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#f1f2f6', display: 'block' }}>
                        {item.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Persistent Sticky Bottom Input Bar */}
      <Box className="input-bar">
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#1b2234', 
            borderRadius: 3, 
            px: 2, 
            py: 0.5,
            border: '1px solid #334155'
          }}
        >
          <InputBase
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms (e.g. 'I have severe chest pain')..."
            fullWidth
            disabled={isTyping}
            sx={{ fontSize: '14px', py: 0.5, color: '#f1f2f6' }}
          />
          <IconButton 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            sx={{ 
              color: '#14b8a6',
              '&.Mui-disabled': { color: '#475569' }
            }}
          >
            ➤
          </IconButton>
        </Box>

        <Button
          variant="contained"
          disabled={messages.length <= 1 || isTyping || !showHospitals}
          onClick={onFinishConsultation}
          sx={{
            bgcolor: '#14b8a6',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            px: 2.5,
            height: '40px',
            borderRadius: 3,
            '&:hover': { bgcolor: '#0d9488' }
          }}
        >
          Find Route & Hospitals
        </Button>
      </Box>
    </Box>
  );
}

export default ChatArea;
