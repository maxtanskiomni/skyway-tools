import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: alpha(color, 0.1),
            mr: 2
          }}
        >
          <Icon sx={{ color: color, fontSize: 24 }} />
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 600, color: color, mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricCard; 