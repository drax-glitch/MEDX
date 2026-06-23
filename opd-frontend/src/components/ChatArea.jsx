import { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, IconButton, InputBase, Grid } from '@mui/material';

function ChatArea({ messages, onSelectSymptom, onFinishConsultation, onAddUserTextMessage, isTyping }) {
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

  const quickSymptoms = [
    { label: 'Chest Pain', icon: '❤️', value: 'Chest Pain', color: '#ef4444' },
    { label: 'Fever', icon: '🤒', value: 'Fever', color: '#f59e0b' },
    { label: 'Breathing Issue', icon: '🫁', value: 'Breathing Issue', color: '#8b5cf6' },
    { label: 'Accident', icon: '🚑', value: 'Accident', color: '#3b82f6' },
    { label: 'Head Injury', icon: '🤕', value: 'Head Injury', color: '#e11d48' },
    { label: 'Pregnancy', icon: '🤰', value: 'Pregnancy', color: '#ec4899' },
  ];

  // Welcome state is when there's only the start greeting
  const showStarters = messages.length === 1 && !isTyping;

  return (
    <Box className="chat-container">
      {/* Network Status Header */}
      <Box 
        sx={{ 
          p: '16px 24px', 
          borderBottom: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#ffffff'
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#0f172a' }}>
            💬 MEDX Consultation Room
          </Typography>
          <Typography variant="caption" color="text.secondary">
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
          return (
            <Box
              key={index}
              sx={{
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              {/* Sender label for AI */}
              {isAI && (
                <Typography variant="caption" sx={{ color: '#14b8a6', fontWeight: 'bold', pl: 1 }}>
                  🩺 MEDX AI
                </Typography>
              )}
              
              <Box
                sx={{
                  bgcolor: isAI ? '#f1f5f9' : '#14b8a6',
                  color: isAI ? '#0f172a' : '#ffffff',
                  borderRadius: isAI ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  p: '12px 18px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  border: isAI ? '1px solid #e2e8f0' : 'none'
                }}
              >
                <Typography variant="body1" sx={{ fontSize: '14.5px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {/* Flashing Generating Typing animation */}
        {isTyping && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#14b8a6', fontWeight: 'bold', pl: 1 }}>
              🩺 MEDX AI
            </Typography>
            <Box sx={{ bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '12px 12px 12px 2px', p: '12px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: '500' }}>
                MEDX is analyzing
              </Typography>
              <Box className="typing-dots" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <span className="dot">●</span>
                <span className="dot" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="dot" style={{ animationDelay: '0.4s' }}>●</span>
              </Box>
            </Box>

            <style>{`
              .typing-dots .dot {
                animation: pulseDot 1.2s infinite;
                font-size: 8px;
              }
              @keyframes pulseDot {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
              }
            `}</style>
          </Box>
        )}

        {/* Welcome Grid Symptom Starters */}
        {showStarters && (
          <Box sx={{ mt: 2, border: '1px dashed #cbd5e1', borderRadius: 3, p: 3, bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#0f172a', mb: 1 }}>
              💡 Quick Triage Starters
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
              Choose a quick symptom card below to initiate diagnostic matching:
            </Typography>

            <Grid container spacing={2}>
              {quickSymptoms.map((item) => (
                <Grid item xs={6} sm={4} key={item.value}>
                  <Card
                    onClick={() => onSelectSymptom(item.value)}
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      boxShadow: 'none',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
                        borderColor: item.color,
                        bgcolor: 'rgba(20, 184, 166, 0.02)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        {item.icon}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#0f172a', display: 'block' }}>
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
        {/* Quick select small chip drawer if not welcome page */}
        {!showStarters && (
          <Box sx={{ display: 'none' }} /> // kept for spacing
        )}

        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#f1f5f9', 
            borderRadius: 3, 
            px: 2, 
            py: 0.5,
            border: '1px solid #cbd5e1'
          }}
        >
          <InputBase
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms (e.g. 'I have severe chest pain')..."
            fullWidth
            disabled={isTyping}
            sx={{ fontSize: '14px', py: 0.5 }}
          />
          <IconButton 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            sx={{ 
              color: '#14b8a6',
              '&.Mui-disabled': { color: '#cbd5e1' }
            }}
          >
            ➤
          </IconButton>
        </Box>

        <Button
          variant="contained"
          disabled={messages.length <= 1 || isTyping}
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
