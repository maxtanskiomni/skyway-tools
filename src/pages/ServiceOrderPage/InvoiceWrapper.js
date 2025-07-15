import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useHistory, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Invoice from './Invoice';
import { StateManager } from '../../utilities/stateManager';

export default function InvoiceWrapper() {
  const history = useHistory();
  const { stockNumber } = useParams();
  const [order, setOrder] = React.useState(StateManager.order || {});

  const handleBack = () => {
    history.push(`/service-order/${stockNumber}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Service Order
        </Button>
        <Typography variant="h5">
          Invoice for {stockNumber}
        </Typography>
      </Box>
      
      <Invoice order={order} />
    </Box>
  );
} 