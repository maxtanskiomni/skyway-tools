import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
} from '@mui/material';
import moment from 'moment';
import firebase from '../utilities/firebase';
import { StateManager } from '../utilities/stateManager';

const OrderPartDialog = ({ open, onClose, order, onSuccess }) => {
  console.log(order);
  const [form, setForm] = useState({
    name: '',
    vendor: '',
    partNumber: '',
    link: '',
    quantity: 1,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isBackoffice = StateManager.isBackoffice();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm({
      name: '',
      vendor: '',
      partNumber: '',
      link: '',
      quantity: 1,
      notes: '',
    });
    setError('');
    setSubmitting(false);
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Part name is always required unless user is backoffice
      if (!form.name && !isBackoffice) {
        setError('Part name is required.');
        setSubmitting(false);
        return;
      }

      // Need either link OR both vendor and part number (unless user is backoffice)
      if (!isBackoffice) {
        const hasLink = form.link && form.link.trim() !== '';
        const hasVendorAndPartNumber = form.vendor && form.vendor.trim() !== '' && form.partNumber && form.partNumber.trim() !== '';
        
        if (!hasLink && !hasVendorAndPartNumber) {
          setError('Please provide either a part link OR both vendor and part number.');
          setSubmitting(false);
          return;
        }
      }

      const partObj = {
        ...form,
        quantity: parseInt(form.quantity, 10) || 1,
        date: moment().format('YYYY/MM/DD'),
        status: 'pending',
        order: order?.id || '',
      };
      await firebase.firestore().collection('parts').add(partObj);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to order part. Please try again.');
      console.error('Order part error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Part request for {order?.car_title || ''}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required={!isBackoffice}
                helperText={isBackoffice ? "Optional" : "Required"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vendor"
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                fullWidth
                helperText={isBackoffice ? "Optional" : "Required if no link provided"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Part Number"
                name="partNumber"
                value={form.partNumber}
                onChange={handleChange}
                fullWidth
                helperText={isBackoffice ? "Optional" : "Required if no link provided"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Link"
                name="link"
                value={form.link}
                onChange={handleChange}
                fullWidth
                helperText="Alternative to vendor/part number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 1 }}
                required={!isBackoffice}
                helperText={isBackoffice ? "Optional" : "Required"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
          {error && (
            <Box mt={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OrderPartDialog; 