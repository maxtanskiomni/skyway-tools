import React, { useState } from 'react';
import {
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Grid,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';

const FIXED_THUMBNAIL_URL = 'https://play-lh.googleusercontent.com/voeaR1fpYv7TAy-SjtoLqSY3pgI7YqNycVQv590lpL2G0L1WDGLYaRn_Yk_b4pahWUE';

const AddOutsideCarForm = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    carTitle: '',
    customerName: '',
    address: '',
    stopType: 'pickup',
    charge: '',
    phone_number: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.carTitle.trim()) newErrors.carTitle = 'Car Title is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.charge || isNaN(parseFloat(formData.charge)) || parseFloat(formData.charge) < 0) {
      newErrors.charge = 'Valid charge amount is required';
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        ...formData,
        charge: parseFloat(formData.charge),
        thumbnail: FIXED_THUMBNAIL_URL,
        id: `outside_stop_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type: 'outside_stop',
        stopType: formData.stopType
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({ 
      carTitle: '', 
      customerName: '', 
      address: '', 
      stopType: 'pickup',
      charge: '', 
      phone_number: '', 
      email: '' 
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Outside Car / Stop</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Stop Type</FormLabel>
              <RadioGroup
                row
                name="stopType"
                value={formData.stopType}
                onChange={handleChange}
              >
                <FormControlLabel value="pickup" control={<Radio />} label="Pickup" />
                <FormControlLabel value="dropoff" control={<Radio />} label="Dropoff" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="carTitle"
              label="Car Title / Description"
              value={formData.carTitle}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.carTitle}
              helperText={errors.carTitle}
              autoComplete="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="customerName"
              label="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.customerName}
              helperText={errors.customerName}
              autoComplete="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="phone_number"
              label="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.phone_number}
              helperText={errors.phone_number}
              autoComplete="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email (Required for credit card payment)"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              autoComplete="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="address"
              label={formData.stopType === 'pickup' ? 'Pickup Address' : 'Delivery Address'}
              value={formData.address}
              onChange={handleChange}
              fullWidth
              required
              multiline
              rows={3}
              error={!!errors.address}
              helperText={errors.address}
              autoComplete="off"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="charge"
              label="Shipping Charge"
              value={formData.charge}
              onChange={handleChange}
              fullWidth
              required
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={!!errors.charge}
              helperText={errors.charge}
              autoComplete="off"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save Stop</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOutsideCarForm;