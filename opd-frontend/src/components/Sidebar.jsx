import { Box, Button, Typography, List, ListItem, ListItemButton, ListItemText, Card, CardContent, Divider } from '@mui/material';

function Sidebar({ onNewConsultation, currentTab, setCurrentTab }) {
  const navItems = [
    { label: '🏠 Home', tab: 'home', disabled: false },
    { label: '💬 Consultation', tab: 'consultation', disabled: false },
    { label: '🏥 Hospitals', tab: 'results', disabled: false },
    { label: '🚑 Emergency', tab: 'emergency', disabled: true },
    { label: '📅 Appointments', tab: 'appointments', disabled: true },
  ];

  return (
    <Box className="sidebar">
      {/* Top Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1, color: '#14b8a6' }} className="glow-logo">
            🩺 MEDX
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: '700', fontSize: '11px', mt: 0.5 }}>
            AI Healthcare Assistant
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Start consultation button */}
        <Button
          variant="contained"
          fullWidth
          onClick={onNewConsultation}
          sx={{
            bgcolor: '#14b8a6',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            py: 1.2,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#0d9488'
            }
          }}
        >
          💬 New Consultation
        </Button>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Navigation List */}
        <Box>
          <List sx={{ p: 0 }}>
            {navItems.map((item) => {
              const isSelected = currentTab === item.tab;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 0.2 }}>
                  <ListItemButton
                    selected={isSelected}
                    disabled={item.disabled}
                    onClick={() => setCurrentTab(item.tab)}
                    sx={{
                      borderRadius: isSelected ? '0px 8px 8px 0px' : '8px',
                      borderLeft: isSelected ? '3px solid #14b8a6' : '3px solid transparent',
                      py: 1,
                      px: 1.5,
                      '&.Mui-selected': { 
                        bgcolor: 'rgba(20, 184, 166, 0.12)',
                        color: '#14b8a6',
                        '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.2)' }
                      },
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.35,
                        color: '#475569'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontSize: '14px', 
                        fontWeight: isSelected ? 'bold' : '500',
                        color: isSelected ? '#14b8a6' : '#e2e8f0' 
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Emergency Callout Card */}
        <Card sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'white', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🚑 Emergency?
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.5, mb: 1.5 }}>
              Need immediate help?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                href="tel:108"
                sx={{
                  bgcolor: '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  '&:hover': { bgcolor: '#dc2626' }
                }}
              >
                Call 108
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  '&:hover': { 
                    borderColor: '#ef4444',
                    bgcolor: 'rgba(239, 68, 68, 0.05)'
                  }
                }}
              >
                Request Ambulance
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Footer */}
        <Box sx={{ opacity: 0.75 }}>
          <Typography variant="caption" sx={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 0.5, color: '#22c55e', fontWeight: 'bold' }}>
            ⚡ System Online
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;
