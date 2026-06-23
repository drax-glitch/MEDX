import { Box } from '@mui/material';
import ChatArea from '../components/ChatArea';
import PatientSummary from '../components/PatientSummary';

function Consultation({ messages, symptoms, onSelectSymptom, onFinishConsultation, onAddUserTextMessage, isTyping }) {
  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Chat Area (Middle Column) */}
      <Box sx={{ flex: 1, height: '100%' }}>
        <ChatArea
          messages={messages}
          onSelectSymptom={onSelectSymptom}
          onFinishConsultation={onFinishConsultation}
          onAddUserTextMessage={onAddUserTextMessage}
          isTyping={isTyping}
        />
      </Box>

      {/* Patient Summary (Right Column) */}
      <Box
        sx={{
          width: '320px',
          bgcolor: '#f8fafc',
          borderLeft: '1px solid #e2e8f0',
          padding: 3,
          overflowY: 'auto'
        }}
      >
        <PatientSummary symptoms={symptoms} currentView="consultation" />
      </Box>
    </Box>
  );
}

export default Consultation;
