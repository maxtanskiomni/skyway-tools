import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

// Helper function to create a high-design numbered circular SVG icon
const getNumberedMarkerIcon = (number) => {
  const size = 28;
  const fontSize = 12;
  const circleColor = "#007AFF";
  const textColor = "#FFFFFF";
  const fontWeight = "500";
  const borderColor = "#FFFFFF";
  const borderWidth = 1.5;

  const svg = `
    <svg width="${size + borderWidth * 2}" height="${size + borderWidth * 2}" viewBox="0 0 ${size + borderWidth * 2} ${size + borderWidth * 2}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="${(size / 2) + borderWidth}" 
        cy="${(size / 2) + borderWidth}" 
        r="${size / 2}" 
        fill="${circleColor}" 
        stroke="${borderColor}" 
        stroke-width="${borderWidth}"
      />
      <text 
        x="50%" 
        y="50%" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        font-size="${fontSize}px" 
        fill="${textColor}" 
        font-weight="${fontWeight}"
        text-anchor="middle" 
        dy=".3em"
      >
        ${number}
      </text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// Custom marker icons for start and end points
const getStartMarkerIcon = () => {
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="${size/2}" 
        cy="${size/2}" 
        r="${size/2 - 2}" 
        fill="#4CAF50" 
        stroke="#FFFFFF" 
        stroke-width="2"
      />
      <path 
        d="M${size/2} ${size/4} L${size/2} ${size*3/4} M${size/4} ${size/2} L${size*3/4} ${size/2}" 
        stroke="#FFFFFF" 
        stroke-width="2" 
        stroke-linecap="round"
      />
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getEndMarkerIcon = () => {
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="${size/2}" 
        cy="${size/2}" 
        r="${size/2 - 2}" 
        fill="#F44336" 
        stroke="#FFFFFF" 
        stroke-width="2"
      />
      <path 
        d="M${size/4} ${size/4} L${size*3/4} ${size*3/4} M${size*3/4} ${size/4} L${size/4} ${size*3/4}" 
        stroke="#FFFFFF" 
        stroke-width="2" 
        stroke-linecap="round"
      />
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const RouteSection = ({ 
  loadData, 
  mapInstance, 
  setMapInstance, 
  markers, 
  startLocation, 
  endLocation, 
  isRouteUpdating 
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['geometry', 'geocoding']
  });

  const decodedPath = useMemo(() => {
    if (isLoaded && loadData?.route_polyline && typeof loadData.route_polyline === 'string' && window.google && window.google.maps && window.google.maps.geometry) {
      try {
        return window.google.maps.geometry.encoding.decodePath(loadData.route_polyline);
      } catch (e) {
        console.error("Error decoding polyline:", e);
        return [];
      }
    }
    return [];
  }, [isLoaded, loadData?.route_polyline]);

  return (
    <Paper sx={{ p: 3, mt: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Route
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Total Distance: {loadData?.total_miles?.toLocaleString() || 0} miles
        </Typography>
      </Box>
      {isLoaded && loadData ? (
        <Box sx={{ position: 'relative' }}>
          {isRouteUpdating && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                backdropFilter: 'blur(2px)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                }}
              >
                <Typography variant="h6" color="primary">
                  Updating Route
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please wait while we recalculate the optimal route...
                </Typography>
              </Box>
            </Box>
          )}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={4}
            options={{
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true
            }}
            onLoad={setMapInstance}
          >
            {/* Start Marker */}
            {startLocation && (
              <Marker
                position={startLocation}
                icon={{
                  url: getStartMarkerIcon(),
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 16)
                }}
                title="Start Location"
              />
            )}

            {/* End Marker */}
            {endLocation && (
              <Marker
                position={endLocation}
                icon={{
                  url: getEndMarkerIcon(),
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 16)
                }}
                title="End Location"
              />
            )}

            {/* Existing vehicle markers */}
            {markers.map((marker, index) => (
              <Marker
                key={marker.car.id || index}
                position={marker.position}
                title={`${index + 1}. ${marker.car.year} ${marker.car.make} ${marker.car.model}`}
                icon={{
                  url: getNumberedMarkerIcon(index + 1),
                  scaledSize: new window.google.maps.Size(28 + 1.5 * 2, 28 + 1.5 * 2),
                  anchor: new window.google.maps.Point((28 / 2) + 1.5, (28 / 2) + 1.5)
                }}
                zIndex={markers.length - index}
              />
            ))}

            {/* Existing polyline */}
            {decodedPath.length > 0 && (
              <Polyline
                path={decodedPath}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            )}
          </GoogleMap>
        </Box>
      ) : (
        <Box sx={{height: '400px', display:'flex', alignItems:'center', justifyContent:'center', bgcolor: 'action.hover', borderRadius:1}}>
          <Typography color="text.secondary">
            {loadData ? 'Loading map...' : 'Route will be displayed once load is initialized'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RouteSection; 