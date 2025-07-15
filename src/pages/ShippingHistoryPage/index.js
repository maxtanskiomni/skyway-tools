import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const ShippingLoadPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shipping Load
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Shipping Load page. This is a placeholder component that will be updated with actual content.
        </Typography>
        <Box sx={{ 
          height: '300px', 
          bgcolor: 'background.paper',
          border: '1px dashed grey',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" color="text.secondary">
            Content coming soon...
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ShippingLoadPage;
