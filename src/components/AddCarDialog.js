import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment';
import firebase from '../utilities/firebase';
import algolia from '../utilities/algolia';
import constants from '../utilities/constants';

const AddCarDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    date: moment().format('YYYY/MM/DD'),
    status: constants.statuses[0],
    status_time: moment().format('YYYY/MM/DD'),
    sub_status: constants.sub_statuses[0],
    sub_status_time: moment().format('YYYY/MM/DD'),
    inDA: false,
    location: 'FL',
    vin: '',
    year: '',
    make: '',
    model: '',
    color: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nextStock, setNextStock] = useState(null);

  // Fetch next stock number when dialog opens
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const counters = await firebase.firestore().doc('admin/counters').get();
          const new_stock = counters.data().lastStock + 1;
          setNextStock('SN' + new_stock.toString());
        } catch (e) {
          setNextStock(null);
        }
      })();
    } else {
      setNextStock(null);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.vin) newErrors.vin = 'VIN is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.color) newErrors.color = 'Color is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Get the next stock number
      const counters = await firebase.firestore().doc('admin/counters').get();
      const new_stock = counters.data().lastStock + 1;
      const stock = "SN" + new_stock.toString();

      // Create the car document
      const carData = {
        ...formData,
        stock,
      };

      // Add to Firebase
      await firebase.firestore().doc('cars/' + stock).set(carData);
      
      // Update counter
      await firebase.firestore().doc('admin/counters').update({ lastStock: new_stock });

      // Add to Algolia
      await algolia.createRecord("cars", { objectID: stock, ...carData });

      // Refresh inventory page if on it
      if (window.location.pathname === '/') {
        window.location.reload();
      }

      // Close dialog and reset form
      handleClose();
    } catch (error) {
      console.error('Error adding car:', error);
      setErrors({ submit: 'Failed to add car. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      date: moment().format('YYYY/MM/DD'),
      status: constants.statuses[0],
      status_time: moment().format('YYYY/MM/DD'),
      sub_status: constants.sub_statuses[0],
      sub_status_time: moment().format('YYYY/MM/DD'),
      inDA: false,
      location: 'FL',
      vin: '',
      year: '',
      make: '',
      model: '',
      color: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          Add New Car{nextStock ? ` (${nextStock})` : ''}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ mt: 1 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                name="location"
                value={formData.location}
                onChange={handleChange}
                label="Location"
              >
                {constants.makeSelects("locations").map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="vin"
              label="VIN"
              value={formData.vin}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.vin}
              helperText={errors.vin}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="year"
              label="Year"
              value={formData.year}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.year}
              helperText={errors.year}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="make"
              label="Make"
              value={formData.make}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.make}
              helperText={errors.make}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="model"
              label="Model"
              value={formData.model}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.model}
              helperText={errors.model}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="color"
              label="Color"
              value={formData.color}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.color}
              helperText={errors.color}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Car'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCarDialog; 