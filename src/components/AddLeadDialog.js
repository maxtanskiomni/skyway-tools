import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Typography,
  Alert,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import moment from 'moment';
import firebase from '../utilities/firebase';
import constants from '../utilities/constants';
import { StateManager } from '../utilities/stateManager';

const AddLeadDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    carsOwned: [],
    carsInterested: [],
    notes: '',
    date: moment().format('YYYY-MM-DD'),
    status: constants.lead_statuses[0], // 'pending contact'
    sales_id: StateManager.userID,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newCarOwned, setNewCarOwned] = useState('');
  const [newCarInterested, setNewCarInterested] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: '',
        carsOwned: [],
        carsInterested: [],
        notes: '',
        date: moment().format('YYYY-MM-DD'),
        status: constants.lead_statuses[0],
        sales_id: StateManager.userID,
      });
      setErrors({});
      setNewCarOwned('');
      setNewCarInterested('');
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const addCarOwned = () => {
    if (newCarOwned.trim()) {
      setFormData(prev => ({
        ...prev,
        carsOwned: [...prev.carsOwned, newCarOwned.trim()]
      }));
      setNewCarOwned('');
    }
  };

  const removeCarOwned = (index) => {
    setFormData(prev => ({
      ...prev,
      carsOwned: prev.carsOwned.filter((_, i) => i !== index)
    }));
  };

  const addCarInterested = () => {
    if (newCarInterested.trim()) {
      setFormData(prev => ({
        ...prev,
        carsInterested: [...prev.carsInterested, newCarInterested.trim()]
      }));
      setNewCarInterested('');
    }
  };

  const removeCarInterested = (index) => {
    setFormData(prev => ({
      ...prev,
      carsInterested: prev.carsInterested.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.email = 'Either email or phone number is required';
      newErrors.phone = 'Either email or phone number is required';
    }
    
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.source.trim()) {
      newErrors.source = 'Source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const db = firebase.firestore();
      
      // Clean phone number
      const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
      
      const leadData = {
        ...formData,
        phone: cleanPhone,
        sortDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        source: "manual",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('leads').add(leadData);
      
      console.log('Lead added successfully:', docRef.id);
      
      if (onSuccess) {
        onSuccess(docRef.id);
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding lead:', error);
      setErrors({ submit: 'Failed to add lead. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
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
        <Typography variant="h6">Add New Lead</Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="name"
              label="Full Name *"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              autoComplete="off"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              error={!!errors.email}
              helperText={errors.email || 'Either email or phone is required'}
              autoComplete="off"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone || 'Either email or phone is required'}
              autoComplete="off"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.source}>
              <InputLabel>Lead Source *</InputLabel>
              <Select
                name="source"
                value={formData.source}
                onChange={handleChange}
                label="Lead Source *"
              >
                <MenuItem value="Car show">Car show</MenuItem>
                <MenuItem value="Cold call">Cold call</MenuItem>
                <MenuItem value="Cold email">Cold email</MenuItem>
                <MenuItem value="Facebook">Facebook</MenuItem>
                <MenuItem value="Walk-in">Walk-in</MenuItem>
              </Select>
              {errors.source && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.source}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Cars They Own */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Cars They Own
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Add car they own"
                value={newCarOwned}
                onChange={(e) => setNewCarOwned(e.target.value)}
                fullWidth
                onKeyPress={(e) => e.key === 'Enter' && addCarOwned()}
                autoComplete="off"
              />
              <Button
                variant="outlined"
                onClick={addCarOwned}
                disabled={!newCarOwned.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            {formData.carsOwned.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {formData.carsOwned.map((car, index) => (
                  <Chip
                    key={index}
                    label={car}
                    onDelete={() => removeCarOwned(index)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            )}
          </Grid>

          {/* Cars They're Interested In */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Cars They're Interested In
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Add car they're interested in"
                value={newCarInterested}
                onChange={(e) => setNewCarInterested(e.target.value)}
                fullWidth
                onKeyPress={(e) => e.key === 'Enter' && addCarInterested()}
                autoComplete="off"
              />
              <Button
                variant="outlined"
                onClick={addCarInterested}
                disabled={!newCarInterested.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            {formData.carsInterested.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {formData.carsInterested.map((car, index) => (
                  <Chip
                    key={index}
                    label={car}
                    onDelete={() => removeCarInterested(index)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            )}
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Notes"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Additional notes about this lead..."
              autoComplete="off"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadDialog; 