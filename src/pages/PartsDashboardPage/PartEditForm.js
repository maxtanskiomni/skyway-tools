import React, { useCallback, useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Select, MenuItem, Typography, Paper, Divider, IconButton, Tooltip, FormControl, InputLabel, Box, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import moment from 'moment';
import constants from '../../utilities/constants';
import debounce from 'lodash/debounce';
import { StateManager } from '../../utilities/stateManager';
import firebase from '../../utilities/firebase';

const PartEditForm = ({ part, onUpdate, onCancel, onSubmit, onDelete }) => {
  const [purchaseExists, setPurchaseExists] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [creatingPurchase, setCreatingPurchase] = useState(false);
  const costInputRef = useRef(null);

  const statusOptions = constants.part_statuses
    .filter(status => status !== 'complete' || purchaseExists || StateManager.isManager())
    .map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }));

  // Check if purchase already exists
  const checkPurchaseExists = useCallback(async () => {
    if (!part.id) return;
    
    try {
      setCheckingPurchase(true);
      const purchaseDoc = await firebase.firestore()
        .collection('purchases')
        .doc(`PART-${part.id}`)
        .get();
      
      setPurchaseExists(purchaseDoc.exists);
    } catch (error) {
      console.error('Error checking purchase existence:', error);
      setPurchaseExists(false);
    } finally {
      setCheckingPurchase(false);
    }
  }, [part.id]);

  // Create purchase entry
  const handleCreatePurchase = async () => {
    // Get the current cost value from the form input
    const currentCost = costInputRef.current ? parseFloat(costInputRef.current.value) || 0 : (part.cost || 0);
    
    if (!part.id || !currentCost || !part.vendor) {
      StateManager.setAlertAndOpen("Part must have cost and vendor to create purchase", "error");
      return;
    }

    try {
      setCreatingPurchase(true);

      if (!part.order) {
        StateManager.setAlertAndOpen("Could not determine SO number for purchase", "error");
        return;
      }

      const purchaseData = {
        amount: currentCost,
        vendor: part.vendor || '',
        memo: `${part.name || `Part ID: ${part.id}`}`,
        date: moment().format('YYYY/MM/DD'),
        stock: part.order,
        isPayable: false,
        type: 'repair',
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebase.firestore()
        .collection('purchases')
        .doc(`PART-${part.id}`)
        .set(purchaseData);

      setPurchaseExists(true);
      
      // Update the status immediately without debouncing
      const statusUpdate = {
        status: 'complete',
        status_time: moment().format('YYYY/MM/DD')
      };
      
      // Call onUpdate to sync with parent component immediately
      onUpdate(statusUpdate);

      //Close the form
      onSubmit();
      
      StateManager.setAlertAndOpen("Purchase entry created and part marked as complete", "success");
    } catch (error) {
      console.error('Error creating purchase:', error);
      StateManager.setAlertAndOpen("Error creating purchase entry", "error");
    } finally {
      setCreatingPurchase(false);
    }
  };

  // Check purchase existence on mount and when part changes
  useEffect(() => {
    checkPurchaseExists();
  }, [checkPurchaseExists]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce((updates) => {
      onUpdate(updates);
    }, 300),
    [onUpdate]
  );

  // Handle text field changes with debouncing
  const handleTextChange = (field) => (e) => {
    const value = e.target.value;
    // Update the local state immediately for responsive UI
    e.target.value = value;
    // Debounce the actual update
    debouncedUpdate({ [field]: value });
  };

  // Handle number field changes with debouncing
  const handleNumberChange = (field) => (e) => {
    const inputValue = e.target.value;
    // Allow empty string or valid numbers (including decimals)
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      // Only parse to number for the update, don't modify the input value
      const numericValue = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
      // Debounce the actual update
      debouncedUpdate({ [field]: numericValue });
    }
  };

  // Handle select changes immediately (no debounce needed)
  const handleSelectChange = (field) => (e) => {
    const value = e.target.value;
    const updates = { [field]: value };
    
    if (field === 'status') {
      // Always update status_time when status changes
      updates.status_time = moment().format('YYYY/MM/DD');
    }
    onUpdate(updates);
  };

  // Handle copy ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(part.id);
  };

  // Handle opening service order in new tab
  const handleOpenServiceOrder = () => {
    if (part.order) {
      window.open(`/service-order/${part.order}`, '_blank');
    }
  };

  // Handle date changes
  const handleDateChange = (field) => (date) => {
    const formattedDate = date ? moment(date).format('YYYY/MM/DD') : null;
    onUpdate({ [field]: formattedDate });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Grid container spacing={4}>
          {/* Header Section */}
          <Grid item xs={12}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Part Details
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Copy Part ID">
                    <IconButton onClick={handleCopyId} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open Service Order">
                    <IconButton 
                      onClick={handleOpenServiceOrder} 
                      size="small"
                      disabled={!part.order}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close">
                    <IconButton onClick={onCancel} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* Image and Vehicle Info Section */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 1
                  }}
                >
                  {part.car_thumbnail ? (
                    <img 
                      src={part.car_thumbnail} 
                      alt="Vehicle" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                      }} 
                    />
                  ) : (
                    <DirectionsCarIcon sx={{ fontSize: 80, color: 'action.disabled' }} />
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Service Order Number"
                      value={part.order || ''}
                      InputProps={{
                        readOnly: true,
                        sx: { 
                          '& .MuiInputBase-input': { 
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Vehicle Information"
                      value={`${part.car_title}`}
                      InputProps={{
                        readOnly: true,
                        sx: { 
                          '& .MuiInputBase-input': { 
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Basic Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Part Name"
                  defaultValue={part.name || ''}
                  onChange={handleTextChange('name')}
                  InputProps={{ 
                    style: { fontSize: 18, fontWeight: 'bold' },
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Part Number"
                  defaultValue={part.partNumber || ''}
                  onChange={handleTextChange('partNumber')}
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor"
                  defaultValue={part.vendor || ''}
                  onChange={handleTextChange('vendor')}
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor Link"
                  defaultValue={part.link || ''}
                  onChange={handleTextChange('link')}
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    defaultValue={part.status || 'pending'}
                    onChange={handleSelectChange('status')}
                    sx={{ 
                      '& .MuiSelect-select': { py: 1.5 },
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  defaultValue={part.location || ''}
                  onChange={handleTextChange('location')}
                  autoComplete="off"
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Dates Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
              Dates
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Order Date"
                  value={part.orderDate ? moment(part.orderDate) : null}
                  onChange={handleDateChange('orderDate')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { '&:hover': { backgroundColor: 'action.hover' } }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Est. Arrival Date"
                  value={part.arrivalDate ? moment(part.arrivalDate) : null}
                  onChange={handleDateChange('arrivalDate')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { '&:hover': { backgroundColor: 'action.hover' } }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Return Date"
                  value={part.returnDate ? moment(part.returnDate) : null}
                  onChange={handleDateChange('returnDate')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { '&:hover': { backgroundColor: 'action.hover' } }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Financial Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
              Financial Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  defaultValue={part.cost || 0}
                  onChange={handleNumberChange('cost')}
                  inputRef={costInputRef}
                  inputProps={{
                    step: "0.01",
                    min: "0"
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ShoppingCartIcon />}
                    onClick={handleCreatePurchase}
                    disabled={
                      checkingPurchase || 
                      creatingPurchase || 
                      purchaseExists || 
                      !part.cost || 
                      !part.vendor
                    }
                    sx={{ minWidth: 200 }}
                  >
                    {checkingPurchase ? 'Checking...' : 
                     creatingPurchase ? 'Creating...' : 
                     purchaseExists ? 'Purchase Exists' : 
                     'Create Purchase Entry'}
                  </Button>
                  {purchaseExists && (
                    <Typography variant="body2" color="success.main" sx={{ fontStyle: 'italic' }}>
                      Purchase entry already exists
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Notes Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
              Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notes"
              defaultValue={part.notes || ''}
              onChange={handleTextChange('notes')}
              InputProps={{
                sx: { '&:hover': { backgroundColor: 'action.hover' } }
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={onDelete}
                sx={{ minWidth: 100 }}
              >
                Delete Part
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={onCancel}
                  sx={{ minWidth: 100 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={onSubmit}
                  sx={{ minWidth: 100 }}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default PartEditForm; 