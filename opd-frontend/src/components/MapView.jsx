import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material';

function MapView({ selectedHospital, hospitalsList = [] }) {
  // Fallback coords centered on Bhubaneswar
  const defaultLat = 20.2800;
  const defaultLng = 85.8000;

  const lat = selectedHospital?.latitude || selectedHospital?.coordinate?.lat || defaultLat;
  const lng = selectedHospital?.longitude || selectedHospital?.coordinate?.lng || defaultLng;

  // Generate OpenStreetMap embed URL
  const zoomOffset = 0.015;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - zoomOffset},${lat - zoomOffset},${lng + zoomOffset},${lat + zoomOffset}&layer=mapnik&marker=${lat},${lng}`;

  // Calculate stats dynamically from the hospital list
  const nearestVal = hospitalsList.length > 0
    ? `${Math.min(...hospitalsList.map(h => {
        const d = h.distance_km || parseFloat(h.distance) || 999;
        return d;
      }))} km`
    : "N/A";

  const fastestVal = hospitalsList.length > 0
    ? `${Math.min(...hospitalsList.map(h => {
        const t = h.travel_time_min || parseInt(h.duration) || 999;
        return t;
      }))} mins`
    : "N/A";

  const mostBedsVal = hospitalsList.length > 0
    ? `${Math.max(...hospitalsList.map(h => h.beds || 0))} available`
    : "N/A";

  const googleMapsUrl = selectedHospital
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps`;

  const handleOpenMap = () => {
    alert("Live navigation will be available once the backend and Google Maps API are connected.");
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: '800', color: '#f1f2f6' }}>
            📍 Nearest Hospitals
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Bhubaneswar, Odisha
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleOpenMap}
          sx={{
            bgcolor: '#14b8a6',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'none',
            '&:hover': { bgcolor: '#0d9488' }
          }}
        >
          🗺️ Get Directions
        </Button>
      </Box>

      {/* Map Container */}
      <Box
        sx={{
          flex: 1,
          minHeight: '280px',
          bgcolor: '#0f172a',
          borderRadius: 3,
          border: '1px solid #1e293b',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <iframe
          title="Hospital Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={osmUrl}
          style={{ border: 'none', filter: 'hue-rotate(200deg) invert(90%) contrast(100%)' }} // Premium Dark Look filter
        />

        {/* Selected Hospital Bottom Banner Overlay */}
        {selectedHospital && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              bgcolor: 'rgba(14, 17, 26, 0.95)',
              border: '1px solid #1e293b',
              p: 2,
              borderRadius: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: '800', color: '#f1f2f6' }}>
                {selectedHospital.hospital_name || selectedHospital.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                {selectedHospital.distance_km ? `${selectedHospital.distance_km} km` : selectedHospital.distance} • {selectedHospital.travel_time_min ? `${selectedHospital.travel_time_min} mins` : selectedHospital.duration} away
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenMap}
              sx={{
                bgcolor: '#14b8a6',
                color: 'white',
                fontWeight: 'bold',
                px: 2,
                '&:hover': { bgcolor: '#0d9488' }
              }}
            >
              Navigate →
            </Button>
          </Box>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={1.5}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#0e111a', border: '1px solid #1e293b', textAlign: 'center' }}>
            <CardContent sx={{ p: '12px !important' }}>
              <Typography variant="h6" sx={{ color: '#14b8a6', fontWeight: '800', fontSize: '15px' }}>
                📍 {nearestVal}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                Nearest
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#0e111a', border: '1px solid #1e293b', textAlign: 'center' }}>
            <CardContent sx={{ p: '12px !important' }}>
              <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: '800', fontSize: '15px' }}>
                ⚡ {fastestVal}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                Fastest
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#0e111a', border: '1px solid #1e293b', textAlign: 'center' }}>
            <CardContent sx={{ p: '12px !important' }}>
              <Typography variant="h6" sx={{ color: '#22c55e', fontWeight: '800', fontSize: '15px' }}>
                🛏️ {mostBedsVal}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                Most Beds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default MapView;
