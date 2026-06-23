import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Divider, RadioGroup, FormControlLabel, Radio, Alert } from '@mui/material';
import PatientSummary from '../components/PatientSummary';

function Booking({ symptoms, hospital, onConfirmBooking }) {
  const [department, setDepartment] = useState('emergency');
  const [slot, setSlot] = useState('immediate');
  const [isBooked, setIsBooked] = useState(false);

  if (!hospital) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hospital selected for booking. Please select a hospital first.
        </Typography>
      </Box>
    );
  }

  const referralCode = `MEDX-${hospital.id}0${symptoms.length || '9'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleConfirm = () => {
    setIsBooked(true);
    if (onConfirmBooking) {
      // Allow passing state updates up
    }
  };

  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      
      {/* Left Booking Config (Flex: 1) */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a' }}>
            📅 SECURE PRE-REGISTRATION & BOOKING
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI Triage Priority Ticket Booking for {hospital.name}
          </Typography>
        </Box>

        {isBooked ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="success" sx={{ py: 2, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                ✅ BED RESERVATION CONFIRMED
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Your emergency admission code has been registered on the hospital's priority network.
              </Typography>
              <Typography variant="h6" sx={{ letterSpacing: '2px', fontWeight: '900', color: '#0f172a', bgcolor: 'rgba(255,255,255,0.7)', p: '8px 16px', borderRadius: 1, display: 'inline-block' }}>
                {referralCode}
              </Typography>
            </Alert>

            <Card sx={{ border: '1px solid #22c55e', bgcolor: 'rgba(34, 197, 94, 0.02)', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 2 }}>
                  📋 Dispatch Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2">
                    <strong>Facility:</strong> {hospital.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Referral Code:</strong> {referralCode}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department:</strong> {department === 'emergency' ? 'Trauma & Emergency Care Unit' : 'General Outpatient OPD'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Transit Mode:</strong> Personal Vehicle / Standard Ambulance dispatched
                  </Typography>
                  <Typography variant="body2">
                    <strong>ER Arrival Window:</strong> Within {hospital.duration} (ETA: {hospital.duration})
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              onClick={() => window.print()}
              sx={{ borderColor: '#cbd5e1', color: '#475569', fontWeight: 'bold' }}
            >
              🖨️ Print referral pass
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Triage Referral Alert */}
            <Alert severity="info" sx={{ fontWeight: 'bold' }}>
              Your referral code <strong>{referralCode}</strong> has been generated with priority match rating of <strong>{hospital.priorityScore}%</strong>.
            </Alert>

            {/* Department Selection */}
            <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#0f172a', mb: 2 }}>
                  Select Admitting Department
                </Typography>
                <RadioGroup value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <FormControlLabel 
                    value="emergency" 
                    control={<Radio color="secondary" />} 
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🚨 Emergency Trauma Ward</Typography>
                        <Typography variant="caption" color="text.secondary">Prioritized for chest pain, respiratory distress, and physical injury triage.</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mb: 2 }}
                  />
                  <FormControlLabel 
                    value="general" 
                    control={<Radio color="secondary" />} 
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🩺 General Clinic OPD</Typography>
                        <Typography variant="caption" color="text.secondary">Suitable for general diagnostics, mild fevers, and routine obstetric visits.</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Slot Picker */}
            <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: '800', color: '#0f172a', mb: 2 }}>
                  Admitting Schedule Slot
                </Typography>
                <RadioGroup value={slot} onChange={(e) => setSlot(e.target.value)}>
                  <FormControlLabel 
                    value="immediate" 
                    control={<Radio color="secondary" />} 
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>⚡ Immediate Trauma Check-in (ETA {hospital.duration})</Typography>
                        <Typography variant="caption" color="text.secondary">Admitting team notified of incoming patient. Priority queue bypass.</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mb: 2 }}
                  />
                  <FormControlLabel 
                    value="scheduled" 
                    control={<Radio color="secondary" />} 
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>🕒 Scheduled Slot (1 Hour Window)</Typography>
                        <Typography variant="caption" color="text.secondary">Save spot for arrival within next 60 minutes.</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Confirm booking CTA */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirm}
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                py: 1.5,
                fontSize: '16px',
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              Confirm Pre-Registration & Secure Bed
            </Button>
          </Box>
        )}
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
        <PatientSummary symptoms={symptoms} currentView="booking" />
      </Box>
    </Box>
  );
}

export default Booking;
