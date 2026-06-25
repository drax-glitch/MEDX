import { Box, Typography, Chip, Divider, Card, CardContent, Stepper, Step, StepLabel, StepConnector } from '@mui/material';
import { styled } from '@mui/material/styles';

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: '#1e293b',
    borderWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: '#14b8a6',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: '#14b8a6',
  },
}));

function PatientSummary({ symptoms = [], currentView = 'consultation' }) {
  const hasCritical = symptoms.some(s => s === 'Chest Pain' || s === 'Breathing Issue');
  const hasTrauma = symptoms.some(s => s === 'Accident' || s === 'Head Injury');
  const hasModerate = symptoms.some(s => s === 'Fever' || s === 'Pregnancy');

  let score = 0;
  let severity = '🟢 Low';
  let priority = '🟢 Routine';
  let severityLabelColor = '#22c55e';
  let priorityLabelColor = '#22c55e';
  let reasons = ['Awaiting symptoms input...'];

  if (hasCritical) {
    score = 98;
    severity = '🔴 High';
    priority = '🔴 Emergency';
    severityLabelColor = '#ef4444';
    priorityLabelColor = '#ef4444';
    reasons = [
      'Severe respiratory/cardiac symptoms reported',
      'Immediate trauma response guidelines active',
      'Nearest level-1 emergency routing required'
    ];
  } else if (hasTrauma) {
    score = 85;
    severity = '🔴 High';
    priority = '🔴 Emergency';
    severityLabelColor = '#ef4444';
    priorityLabelColor = '#ef4444';
    reasons = [
      'Physical trauma or head injury flagged',
      'High risk of structural concussion',
      'Requires ER imaging diagnostics'
    ];
  } else if (hasModerate) {
    score = 60;
    severity = '🟡 Medium';
    priority = '🟡 Urgent';
    severityLabelColor = '#f59e0b';
    priorityLabelColor = '#f59e0b';
    reasons = [
      'Obstetrics query or elevated fever triage',
      'Non-critical urgent care clinics recommended'
    ];
  } else if (symptoms.length > 0) {
    score = 30;
    severity = '🟢 Low';
    priority = '🟢 Routine';
    reasons = [
      'Mild localized symptoms reported',
      'Standard clinical consultations matched'
    ];
  }

  // Visual AI workflow pipeline steps
  const steps = [
    { label: 'Symptoms', active: symptoms.length > 0 },
    { label: 'Assessment', active: symptoms.length > 0 },
    { label: 'Priority Score', active: symptoms.length > 0 },
    { label: 'Hospital Matching', active: currentView === 'results' || currentView === 'booking' },
    { label: 'Route Planning', active: currentView === 'results' || currentView === 'booking' },
  ];

  return (
    <Box className="patient-summary" sx={{ gap: 2, bgcolor: '#0e111a', borderLeft: '1px solid #1e293b' }}>
      <Typography variant="h6" sx={{ fontWeight: '800', color: '#f1f2f6', display: 'flex', alignItems: 'center', gap: 1 }}>
        📋 Patient Summary
      </Typography>

      {/* Compact Demographics and Current Assessment Card */}
      <Card sx={{ border: '1px solid #1e293b', bgcolor: '#0a0c14', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px !important' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', display: 'block', mb: 1.5 }}>
            CURRENT ASSESSMENT
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                ⚠️ Severity:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: severityLabelColor }}>
                {severity}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                🚨 Priority:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: priorityLabelColor }}>
                {priority}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, borderColor: '#1e293b' }} />

            <Box>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8', mb: 0.5 }}>
                📝 Reported Symptoms:
              </Typography>
              {symptoms.length === 0 ? (
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#64748b', pl: 1 }}>
                  • None reported yet
                </Typography>
              ) : (
                <Box sx={{ pl: 1, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                  {symptoms.map((symptom, idx) => (
                    <Typography key={idx} variant="caption" sx={{ color: '#f1f2f6', fontWeight: '500' }}>
                      • {symptom}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 0.5, borderColor: '#1e293b' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                📍 Location:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f1f2f6' }}>
                Bhubaneswar
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* MEDX Priority Score & Reasoning */}
      <Card sx={{ border: '1px solid #1e293b', bgcolor: score >= 85 ? 'rgba(239, 68, 68, 0.05)' : '#0a0c14', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
              MEDX PRIORITY SCORE
            </Typography>
            <Chip 
              label={`${score}/100`} 
              size="small"
              sx={{ 
                fontWeight: '900', 
                bgcolor: score >= 85 ? '#ef4444' : score >= 60 ? '#f59e0b' : '#22c55e',
                color: 'white',
                fontSize: '12px'
              }}
            />
          </Box>

          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            AI REFERRAL REASONING
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {reasons.map((reason, idx) => (
              <Typography key={idx} variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.3 }}>
                • {reason}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ borderColor: '#1e293b' }} />

      {/* Workflow timeline */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#94a3b8', mb: 1.5 }}>
          AI Processing Pipeline
        </Typography>
        <Stepper orientation="vertical" connector={<CustomConnector />} sx={{ p: 0 }}>
          {steps.map((step) => (
            <Step key={step.label} active={step.active} completed={step.active}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    color: step.active ? '#14b8a6 !important' : '#334155 !important',
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: step.active ? 'bold' : 'normal',
                    color: step.active ? '#f1f2f6' : '#475569'
                  }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Box>
  );
}

export default PatientSummary;
