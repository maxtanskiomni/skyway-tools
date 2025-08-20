import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Box,
  Avatar,
  Divider,
  IconButton,
  CircularProgress,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PaymentLine from '../../components/PaymentLine';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';

const VehicleDetailsDialog = ({ open, onClose, vehicle, loadId, onUpdateField }) => {
  const [customer, setCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [editedVehicle, setEditedVehicle] = useState(null);
  const [carDetails, setCarDetails] = useState(null);

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      StateManager.setAlertAndOpen("Copied to clipboard!", "success");
    } catch (err) {
      StateManager.setAlertAndOpen("Failed to copy to clipboard", "error");
    }
  };

  const fetchCustomerData = async (customerId) => {
    try {
      if (!customerId) {
        // For outside cars, use the information directly from the car object
        setCustomer({
          customerName: vehicle.customerName || 'N/A',
          address: vehicle.address || 'N/A',
          phone_number: vehicle.phone_number || 'N/A',
          email: vehicle.email || 'N/A'
        });
        return;
      }

      const doc = await firebase.firestore().collection('customers').doc(customerId).get();
      if (doc.exists) {
        const data = doc.data();
        setCustomer({ 
          id: doc.id,
          customerName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'N/A',
          address: vehicle.address || 'N/A',
          phone_number: data.phone_number || 'N/A', 
          email: data.email || 'N/A',
          ...data
        });
      } else {
        StateManager.setAlertAndOpen("Customer not found", "error");
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      StateManager.setAlertAndOpen("Error fetching customer details", "error");
    }
  };

  const fetchCarDetails = async (carId) => {
    try {
      if (!carId) return;

      const doc = await firebase.firestore().collection('cars').doc(carId).get();
      if (doc.exists) {
        const data = doc.data();
        setCarDetails(data);
      }
    } catch (error) {
      console.error('Error fetching car details:', error);
    }
  };

  useEffect(() => {
    if (vehicle) {
      setEditedVehicle(vehicle);
      fetchCustomerData(vehicle.customerId);
      fetchCarDetails(vehicle.id);
    }
  }, [vehicle]);

  useEffect(() => {
    if (!open) {
      setCustomer(null);
      setCarDetails(null);
    }
  }, [open]);

  const handleEdit = () => {
    setEditedCustomer({ ...customer });
    setEditedVehicle({ ...vehicle });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (customer.id) {
        // Update in Firestore
        await firebase.firestore().collection('customers').doc(customer.id).update({
          first_name: editedCustomer.customerName.split(' ')[0],
          last_name: editedCustomer.customerName.split(' ').slice(1).join(' '),
          phone_number: editedCustomer.phone_number,
          email: editedCustomer.email,
        });
      }

      // Update the car in the load data
      if (vehicle.id) {
        const updatedCar = {
          ...vehicle,
          carTitle: editedVehicle.carTitle,
          stopType: editedVehicle.stopType,
          customerName: editedCustomer.customerName,
          address: editedCustomer.address,
          phone_number: editedCustomer.phone_number,
          email: editedCustomer.email,
        };

        await onUpdateField('cars', null, {
          carId: vehicle.id,
          updates: {
            carTitle: editedVehicle.carTitle,
            stopType: editedVehicle.stopType,
            customerName: editedCustomer.customerName,
            address: editedCustomer.address,
            phone_number: editedCustomer.phone_number,
            email: editedCustomer.email,
          }
        });

        // Update local state
        setEditedVehicle(updatedCar);
        setCustomer({
          ...customer,
          customerName: editedCustomer.customerName,
          address: editedCustomer.address,
          phone_number: editedCustomer.phone_number,
          email: editedCustomer.email,
        });
      }

      setIsEditing(false);
      StateManager.setAlertAndOpen("Information updated successfully", "success");
    } catch (error) {
      console.error('Error updating information:', error);
      StateManager.setAlertAndOpen("Failed to update information", "error");
    }
  };

  const handleCancel = () => {
    setEditedCustomer(null);
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleFieldChange = (field, value) => {
    setEditedVehicle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedCustomer(null);
    setEditedVehicle(null);
    onClose();
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
        <Typography variant="h6" component="div">
          Vehicle Details
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {StateManager.isBackoffice() && !isEditing && (
            <Button 
              variant="outlined" 
              onClick={handleEdit}
              size="small"
            >
              Edit Information
            </Button>
          )}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!vehicle ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Vehicle Image and Info */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2
              }}>
                <Box sx={{ 
                  width: '100%',
                  height: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={vehicle.thumbnail} 
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
                
                <Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editedVehicle.carTitle}
                      onChange={(e) => handleVehicleFieldChange('carTitle', e.target.value)}
                      label="Car Title / Description"
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="h5" gutterBottom>
                      {vehicle.type === "outside_stop" ? vehicle.carTitle : `${vehicle.id} - ${vehicle.carTitle}`}
                    </Typography>
                  )}
                </Box>

                {isEditing && (
                  <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Stop Type</FormLabel>
                      <RadioGroup
                        row
                        name="stopType"
                        value={editedVehicle.stopType || 'pickup'}
                        onChange={(e) => handleVehicleFieldChange('stopType', e.target.value)}
                      >
                        <FormControlLabel value="pickup" control={<Radio />} label="Pickup" />
                        <FormControlLabel value="dropoff" control={<Radio />} label="Dropoff" />
                      </RadioGroup>
                    </FormControl>
                  </Box>
                )}

                {!isEditing && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Stop Type: {vehicle.stopType === 'pickup' ? 'Pickup' : 'Dropoff'}
                    </Typography>
                  </Box>
                )}

                {/* VIN Display */}
                {(vehicle.vin || (carDetails && carDetails.vin)) && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        VIN
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyToClipboard(vehicle.vin || carDetails?.vin)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {vehicle.vin || carDetails?.vin}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="h5" gutterBottom>
                  Customer Information
                </Typography>
                
                {!customer ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ 
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'grey.50'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {customer.customerName}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyToClipboard(customer.customerName)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Address
                          </Typography>
                          {!isEditing && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopyToClipboard(customer.address)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            value={editedCustomer.address}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            label="Address"
                          />
                        ) : (
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            component="a"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {customer.address}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Phone
                          </Typography>
                          {!isEditing && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopyToClipboard(customer.phone_number)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            value={editedCustomer.phone_number}
                            onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                            label="Phone Number"
                          />
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            {customer.phone_number || 'N/A'}
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Email
                          </Typography>
                          {!isEditing && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopyToClipboard(customer.email)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            value={editedCustomer.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            label="Email"
                          />
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            {customer.email || 'N/A'}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Payment Section */}
                    {StateManager.isBackoffice() && 
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Payment Information
                        </Typography>
                        <PaymentLine
                          reference={loadId}
                          customer={customer}
                          type="shipping"
                          title={`${vehicle.carTitle} Shipping`}
                          thumbnail={vehicle.thumbnail}
                          revenue={vehicle.charge}
                          removeCheck
                          deposits={0}
                        />
                      </Box>
                    }
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      {isEditing && (
        <DialogActions sx={{ 
          justifyContent: 'center', 
          px: 3, 
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="outlined" 
            onClick={handleCancel}
            sx={{ minWidth: 120 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{ minWidth: 120 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default VehicleDetailsDialog; 