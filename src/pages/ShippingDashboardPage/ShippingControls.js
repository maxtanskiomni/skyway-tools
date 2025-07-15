import React, { useState } from 'react';
import { Typography, Switch, Grid, Button, Box, IconButton, Tooltip, TextField, Chip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  shippingChip: {
    '&.shipping-in': {
      backgroundColor: theme.palette.info.light,
      color: theme.palette.info.contrastText,
    },
    '&.shipping-out': {
      backgroundColor: theme.palette.success.light,
      color: theme.palette.success.contrastText,
    },
  },
}));

const ShippingControls = ({ car, onUpdate }) => {
  const classes = useStyles();
  const [price, setPrice] = useState(
    car.deal.shipping ? car.shipping_invoice?.price || '' :
    car.deal.shipping_in ? car.shipping_in_invoice?.price || '' : ''
  );

  const [invoiceDate, setInvoiceDate] = useState(
    car.deal.shipping ? moment(car.shipping_invoice?.date) :
    car.deal.shipping_in ? moment(car.shipping_in_invoice?.date) :
    moment()
  );

  const handleDeliveryToggle = async (currentStatus) => {
    try {
      await firebase.firestore().doc('deals/' + car.id).set({
        shipping_complete: !currentStatus,
        shipping_status: !currentStatus ? 'complete' : 'pending'
      }, { merge: true });
      
      // Update local state
      onUpdate({
        ...car,
        shipping_complete: !currentStatus
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      StateManager.setAlertAndOpen("Error updating delivery status", "error");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    StateManager.setAlertAndOpen("Copied to clipboard!", "success");
  };

  const formatAddress = (customer) => {
    if (!customer) return 'No address available';
    const parts = [
      customer.address1,
      customer.address2,
      `${customer.city}, ${customer.state} ${customer.zip}`
    ].filter(Boolean);
    return parts.join('\n');
  };

  const handlePriceChange = async (value) => {
    setPrice(value);
    await updateInvoice(value, invoiceDate);
  };

  const handleDateChange = async (newDate) => {
    setInvoiceDate(newDate);
    await updateInvoice(price, newDate);
  };

  const updateInvoice = async (priceValue, dateValue) => {
    try {
      // Determine if this is shipping out or shipping in
      const isShippingOut = !car.deal.shipping_in;
      const invoiceKey = isShippingOut ? 'shipping' : 'shipping_in';
      const existingInvoiceId = car.deal[invoiceKey];

      // Create or update the invoice document
      const invoiceRef = existingInvoiceId 
        ? firebase.firestore().doc(`invoices/${existingInvoiceId}`)
        : firebase.firestore().collection('invoices').doc();

      await invoiceRef.set({
        price: priceValue,
        total: priceValue,
        stock: car.stock,
        date: dateValue.format('YYYY/MM/DD'),
        type: isShippingOut ? 'shipping_out' : 'shipping_in'
      });

      // If this is a new invoice, update the deal with the invoice reference
      if (!existingInvoiceId) {
        await firebase.firestore().doc(`deals/${car.id}`).update({
          [invoiceKey]: invoiceRef.id
        });
      }

      // Update local state
      onUpdate({
        ...car,
        [isShippingOut ? 'shipping_invoice' : 'shipping_in_invoice']: {
          price: priceValue,
          total: priceValue,
          stock: car.stock,
          date: dateValue.format('YYYY/MM/DD'),
          type: isShippingOut ? 'shipping_out' : 'shipping_in'
        }
      });

    } catch (error) {
      console.error('Error updating invoice:', error);
      StateManager.setAlertAndOpen("Error updating invoice", "error");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Shipping Status
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>Delivery Status</Typography>
            <Switch
              checked={car.shipping_complete || false}
              onChange={() => handleDeliveryToggle(car.shipping_complete)}
              color="primary"
            />
          </div>
        </Grid>

        {car.customer && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Name: {`${car.customer.first_name || ''} ${car.customer.last_name || ''}`}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>
                    Address:
                  </Typography>
                  <Box sx={{ flex: 2 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {formatAddress(car.customer)}
                    </pre>
                  </Box>
                  <Tooltip title="Copy Address">
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopy(formatAddress(car.customer))}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {car.customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      Email:
                    </Typography>
                    <Typography sx={{ flex: 2 }}>{car.customer.email}</Typography>
                    <Tooltip title="Copy Email">
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopy(car.customer.email)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {car.customer.phone_number && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      Phone:
                    </Typography>
                    <Typography sx={{ flex: 2 }}>{car.customer.phone_number}</Typography>
                    <Tooltip title="Copy Phone">
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopy(car.customer.phone_number)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Shipping Invoice
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {car.deal?.shipping_in ? (
                  <Chip
                    icon={<DownloadIcon />}
                    label="Shipping In"
                    className={`${classes.shippingChip} shipping-in`}
                    size="medium"
                  />
                ) : car.deal?.shipping ? (
                  <Chip
                    icon={<UploadIcon />}
                    label="Shipping Out"
                    className={`${classes.shippingChip} shipping-out`}
                    size="medium"
                  />
                ) : (
                  <Chip
                    icon={<DirectionsCarIcon />}
                    label="Not Set"
                    size="medium"
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shipping Price"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  size="small"
                  type="number"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Invoice Date"
                    value={invoiceDate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={() => window.open(`/car/${car.stock}`, '_blank')}
          >
            View Car Details
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default ShippingControls; 