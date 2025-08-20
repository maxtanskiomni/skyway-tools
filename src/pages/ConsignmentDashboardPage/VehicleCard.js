import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import moment from 'moment';

// Vehicle Card Component
const VehicleCard = ({ vehicle, onCardClick }) => {
  const theme = useTheme();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'sold':
        return theme.palette.success.main;
      case 'active':
        return theme.palette.primary.main;
      case 'marketing':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  const handleCardClick = (event) => {
    // Check if Ctrl or Cmd key is pressed
    if (event.ctrlKey || event.metaKey) {
      // Open in new tab
      event.preventDefault();
      window.open(`/car/${vehicle.id}`, '_blank');
    } else {
      // Normal click behavior
      onCardClick(vehicle);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
      onClick={handleCardClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={vehicle.thumbnail || '/missing_image.jpeg'}
        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {vehicle.stock}
          </Typography>
          <Chip
            label={vehicle.status?.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: alpha(getStatusColor(vehicle.status), 0.1),
              color: getStatusColor(vehicle.status),
              fontWeight: 600
            }}
          />
        </Box>
        
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Typography>
        
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {vehicle.consignor_name || 'Unknown'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {vehicle.date ? moment(vehicle.date, 'YYYY/MM/DD').format('MM/DD/YYYY') : 'No date'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {vehicle.lead_count || 0} leads
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default VehicleCard; 