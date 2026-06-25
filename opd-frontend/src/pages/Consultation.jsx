import { Box } from '@mui/material';
import ChatArea from '../components/ChatArea';
import PatientSummary from '../components/PatientSummary';
import MapView from '../components/MapView';

function Consultation({
  messages,
  symptoms,
  onSelectSymptom,
  onFinishConsultation,
  onAddUserTextMessage,
  isTyping,
  showHospitals,
  hospitalsList,
  selectedHospital,
  onSelectHospital
}) {
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
          showHospitals={showHospitals}
          hospitalsList={hospitalsList}
          selectedHospital={selectedHospital}
          onSelectHospital={onSelectHospital}
        />
      </Box>

      {/* Right Column: Toggle between Patient Summary and Interactive Map View */}
      <Box
        sx={{
          width: '360px',
          bgcolor: '#0e111a',
          borderLeft: '1px solid #1e293b',
          padding: 3,
          overflowY: 'auto'
        }}
      >
        {showHospitals ? (
          <MapView
            selectedHospital={selectedHospital}
            hospitalsList={hospitalsList}
          />
        ) : (
          <PatientSummary symptoms={symptoms} currentView="consultation" />
        )}
      </Box>
    </Box>
  );
}

export default Consultation;

