import React, { useCallback, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Select, MenuItem, Typography, Button, Paper, Divider, IconButton, Tooltip, FormControl, InputLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import moment from 'moment';
import constants from '../../utilities/constants';
import debounce from 'lodash/debounce';
import {StateManager} from '../../utilities/stateManager';

const ServiceEditForm = ({ service, onUpdate }) => {
  const statusOptions = constants.service_statuses.map(status => ({
    value: status,
    label: status.toProperCase()
  }));

  let mechanicOptions = constants.mechanics.map(mechanic => ({
    id: mechanic.id,
    value: mechanic.name,
    label: mechanic.name,
    rate: mechanic.rate
  }))
  
  mechanicOptions.unshift({
    id: 'none',
    value: 'None',
    label: 'None',
    rate: 0
  });

  // Memoize the selected mechanic to prevent unnecessary recalculations
  const selectedMechanic = useMemo(() => 
    mechanicOptions.find(m => m.value === service.mechanic),
    [service.mechanic]
  );

  // Memoize the cost calculation
  const calculatedCost = useMemo(() => 
    selectedMechanic ? (selectedMechanic.rate * (service.time || 0)) : 0,
    [selectedMechanic, service.time]
  );

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
    const value = parseFloat(e.target.value) || 0;
    // Update the local state immediately for responsive UI
    e.target.value = value;
    // Calculate cost if hours are changing
    const updates = { [field]: value };
    if (field === 'time' && selectedMechanic) {
      updates.cost = selectedMechanic.rate * value;
    }
    // Debounce the actual update
    debouncedUpdate(updates);
  };

  // Handle select changes immediately (no debounce needed)
  const handleSelectChange = (field) => (e) => {
    const value = e.target.value;
    const updates = { [field]: value };
    
    if (field === 'mechanic') {
      const newMechanic = mechanicOptions.find(m => m.value === value);
      if (newMechanic) {
        updates.cost = newMechanic.rate * (service.time || 0);
        updates.mechanicID = newMechanic.id;
      }
    } else if (field === 'status') {
      // Always update status_time when status changes
      updates.status_time = moment().format('YYYY/MM/DD');
    }
    onUpdate(updates);
  };

  // Handle copy ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(service.id);
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
                  Service Details
                </Typography>
              </Grid>
              <Grid item>
                <Tooltip title="Copy Service ID">
                  <IconButton onClick={handleCopyId} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
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
                  label="Service Name"
                  defaultValue={service.name || ''}
                  onChange={handleTextChange('name')}
                  disabled={!StateManager.isBackoffice()}
                  InputProps={{ 
                    style: { fontSize: 18, fontWeight: 'bold' },
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={service.status || 'pending'}
                    onChange={handleSelectChange('status')}
                    disabled={!StateManager.isManager()}
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
                <FormControl fullWidth>
                  <InputLabel>Mechanic</InputLabel>
                  <Select
                    label="Mechanic"
                    value={service.mechanic || ''}
                    onChange={handleSelectChange('mechanic')}
                    disabled={!StateManager.isBackoffice()}
                    sx={{ 
                      '& .MuiSelect-select': { py: 1.5 },
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    {mechanicOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Status Time"
                  value={service.status_time ? moment(service.status_time) : null}
                  onChange={handleDateChange('status_time')}
                  disabled={!StateManager.isManager()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { 
                        '&:hover': { backgroundColor: 'action.hover' }
                      }
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
                  label="Hours"
                  defaultValue={service.time || 0}
                  onChange={handleNumberChange('time')}
                  disabled={!StateManager.isBackoffice()}
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    backgroundColor: 'action.hover'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Calculated Cost
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    ${calculatedCost.toFixed(2)}
                  </Typography>
                  {selectedMechanic && (
                    <Typography variant="caption" color="text.secondary">
                      Based on {selectedMechanic.label}'s rate of ${selectedMechanic.rate}/hr
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Additional Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
              Additional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  defaultValue={service.notes || ''}
                  onChange={handleTextChange('notes')}
                  InputProps={{
                    sx: { '&:hover': { backgroundColor: 'action.hover' } }
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default ServiceEditForm; 