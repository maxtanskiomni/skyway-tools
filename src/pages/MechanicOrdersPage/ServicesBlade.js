import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import AddServiceOrderDialog from '../../components/AddServiceOrderDialog';

const ServicesBlade = ({ order, onClose, onUpdate, onServiceEdit }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState(order.services || []);
  const [mechanicDialogOpen, setMechanicDialogOpen] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [pendingServiceId, setPendingServiceId] = useState(null);
  const isAdmin = StateManager.isBackoffice();

  // --- STATE for split dialog ---
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitServiceId, setSplitServiceId] = useState(null);
  const [splitHours, setSplitHours] = useState('');
  const [splitError, setSplitError] = useState('');
  const [splitLoading, setSplitLoading] = useState(false);
  // --- STATE for actions menu ---
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [actionsServiceId, setActionsServiceId] = useState(null);

  // --- STATE for AddServiceOrderDialog ---
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);

  // Keep services state in sync with order prop
  useEffect(() => {
    if (order && order.services) {
      setServices(order.services);
    }
  }, [order?.services]);

  const handleServiceUpdate = async (serviceId, updates) => {
    console.log('handleServiceUpdate', serviceId, updates);
    try {
      await firebase.firestore().collection('services').doc(serviceId).update(updates);
      // Update local state
      const updatedServices = services.map(service => 
        service.id === serviceId ? { ...service, ...updates } : service
      );
      setServices(updatedServices);
      onUpdate(updatedServices);
    } catch (error) {
      console.error('Error updating service:', error);
      StateManager.setAlertAndOpen('Error updating service', 'error');
    } 
  };

  const handleStatusChange = (serviceId, newStatus) => {
    if (newStatus === 'complete') {
      // Open mechanic selection dialog
      setPendingServiceId(serviceId);
      setMechanicDialogOpen(true);
    } else {
      // For marking as pending, use the order's mechanic
      const mechanicID = order.mechanicId;
      const mechanic = constants.mechanics.find(m => m.id === mechanicID)?.name;
      const rate = constants.mechanics.find(m => m.id === mechanicID)?.rate;
      const cost = rate * (services.find(s => s.id === serviceId).time || 0);
      handleServiceUpdate(serviceId, { status: newStatus, status_time: moment().format('YYYY/MM/DD'), mechanic, mechanicID, rate, cost });
    }
  };

  const handleMechanicConfirm = () => {
    if (selectedMechanicId && pendingServiceId) {
      const mechanic = constants.mechanics.find(m => m.id === selectedMechanicId)?.name;
      const rate = constants.mechanics.find(m => m.id === selectedMechanicId)?.rate;
      const cost = rate * (services.find(s => s.id === pendingServiceId).time || 0);
      
      handleServiceUpdate(pendingServiceId, { 
        status: 'complete', 
        status_time: moment().format('YYYY/MM/DD'), 
        mechanic, 
        mechanicID: selectedMechanicId, 
        rate, 
        cost 
      });
      
      // Reset dialog state
      setMechanicDialogOpen(false);
      setSelectedMechanicId('');
      setPendingServiceId(null);
    }
  };

  const handleMechanicCancel = () => {
    setMechanicDialogOpen(false);
    setSelectedMechanicId('');
    setPendingServiceId(null);
  };

  const handleAddService = (newServices) => {
    // The real-time listeners in the parent component will handle updates automatically
    // We can just call onUpdate to notify the parent that services were added
    if (newServices && Array.isArray(newServices)) {
      onUpdate(newServices);
    }
  };

  const handleAddTime = (serviceId) => {
    // TODO: Implement add time functionality
    console.log('Add time for service:', serviceId);
  };

  // --- SPLIT LOGIC ---
  const handleOpenSplitDialog = (serviceId) => {
    setSplitServiceId(serviceId);
    setSplitHours('');
    setSplitError('');
    setSplitDialogOpen(true);
  };

  const handleCloseSplitDialog = () => {
    setSplitDialogOpen(false);
    setSplitServiceId(null);
    setSplitHours('');
    setSplitError('');
  };

  const handleConfirmSplit = async () => {
    const service = services.find(s => s.id === splitServiceId);
    if (!service) return;
    const originalHours = parseFloat(service.time) || 0;
    const hoursToSplit = parseFloat(splitHours);
    if (isNaN(hoursToSplit) || hoursToSplit <= 0) {
      setSplitError('Please enter a valid number of hours.');
      return;
    }
    if (hoursToSplit >= originalHours) {
      setSplitError('Split hours must be less than the original hours.');
      return;
    }
    setSplitLoading(true);
    // Find mechanic/rate for cost calculation
    const mechanicID = service.mechanicID || order.mechanicId;
    const mechanicObj = constants.mechanics.find(m => m.id === mechanicID);
    const rate = mechanicObj?.rate || 0;
    // Find next part number for this service name
    const baseName = service.name.replace(/ - part \d+$/, '');
    const siblings = services.filter(s => s.name.startsWith(baseName));
    let maxPart = 1;
    siblings.forEach(s => {
      const match = s.name.match(/ - part (\d+)$/);
      if (match) {
        maxPart = Math.max(maxPart, parseInt(match[1], 10));
      }
    });
    const newPartNum = maxPart + 1;
    // Prepare new service object
    const docRef = await firebase.firestore().collection('services').doc();
    const newService = {
      ...service,
      name: `${baseName} - part ${newPartNum}`,
      time: hoursToSplit,
      cost: rate * hoursToSplit,
      created_at: moment().format('YYYY/MM/DD'),
      status: 'pending',
      id: docRef.id,
    };
    // Update original service
    const updatedOriginal = {
      ...service,
      time: originalHours - hoursToSplit,
      cost: rate * (originalHours - hoursToSplit),
    };
    try {
      // Add new service to Firestore
      await docRef.set({
        ...newService,
        order: order.id,
      });
      // Update original service in Firestore
      await firebase.firestore().collection('services').doc(service.id).update({
        time: updatedOriginal.time,
        cost: updatedOriginal.cost,
      });
      // Update local state (show new service immediately)
      const updatedServices = services
        .map(s => s.id === service.id ? { ...updatedOriginal } : s)
        .concat([newService]);
      setServices(updatedServices);
      onUpdate(updatedServices);
      setSplitLoading(false);
      handleCloseSplitDialog();
    } catch (error) {
      console.error('Error splitting service:', error);
      StateManager.setAlertAndOpen('Error splitting service', 'error');
      setSplitLoading(false);
    }
  };

  // --- ACTIONS MENU LOGIC ---
  const handleOpenActionsMenu = (event, serviceId) => {
    setActionsAnchorEl(event.currentTarget);
    setActionsServiceId(serviceId);
  };
  const handleCloseActionsMenu = () => {
    setActionsAnchorEl(null);
    setActionsServiceId(null);
  };
  const handleMenuSplit = () => {
    handleOpenSplitDialog(actionsServiceId);
    handleCloseActionsMenu();
  };

  const filteredServices = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(searchLower) ||
      (service.mechanic || '').toLowerCase().includes(searchLower)
    );
  }, [services, searchQuery]);

  const pendingServices = filteredServices.filter(service => service.status !== 'complete');
  const completedServices = filteredServices.filter(service => service.status === 'complete');


  const ServiceTable = ({ services, title }) => (
    <>
      <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
        {title} ({services.length})
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow 
                key={service.id}
                hover
                onClick={() => onServiceEdit && StateManager.isBackoffice() && onServiceEdit(service)}
                sx={{ 
                  cursor: (onServiceEdit && StateManager.isBackoffice()) ? 'pointer' : 'default',
                  '&:hover': onServiceEdit && StateManager.isBackoffice() ? {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  } : {}
                }}
              >
                <TableCell>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click when clicking the status button
                      handleStatusChange(service.id, service.status === 'complete' ? 'pending' : 'complete');
                    }}
                    disabled={!isAdmin && service.status === 'complete'}
                    sx={{
                      color: service.status === 'complete' ? theme.palette.success.main : theme.palette.grey[500],
                      '&:hover': {
                        bgcolor: alpha(service.status === 'complete' ? theme.palette.success.main : theme.palette.grey[500], 0.1),
                      },
                    }}
                  >
                    {service.status === 'complete' ? 
                      <RadioButtonCheckedIcon /> : 
                      <RadioButtonUncheckedIcon />
                    }
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography>{service.name}</Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <TimelineIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography>
                      {service.time || 0} hours
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Tooltip title="Split Service Time">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click when clicking the split button
                          handleOpenSplitDialog(service.id);
                        }}
                        size="small"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Divider sx={{ display: 'inline', width: 2, height: 20, bgcolor: theme.palette.primary.main, mr: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Split</Typography>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {isAdmin && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddServiceDialogOpen(true)}
          sx={{ whiteSpace: 'nowrap' }}
          >
            Add Services
          </Button>
        )}
      </Box>
      {filteredServices.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ py: 4 }}>
          <WarningIcon sx={{ fontSize: 48, color: theme.palette.warning.main }} />
          <Typography variant="h6" color="text.secondary">
            No services found
          </Typography>
        </Box>
      ) : (
        <>
          {pendingServices.length > 0 && (
            <ServiceTable services={pendingServices} title="Pending Services" />
          )}
          {completedServices.length > 0 && (
            <>
              {pendingServices.length > 0 && <Divider sx={{ my: 2 }} />}
              <ServiceTable services={completedServices} title="Completed Services" />
            </>
          )}
        </>
      )}

      {/* Mechanic Selection Dialog */}
      <Dialog open={mechanicDialogOpen} onClose={handleMechanicCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Select Mechanic</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select the mechanic who completed this service:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Mechanic</InputLabel>
            <Select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              label="Mechanic"
            >
              {constants.mechanics
                .filter(mechanic => mechanic.name !== "Placeholder")
                .map((mechanic) => (
                  <MenuItem key={mechanic.id} value={mechanic.id}>
                    {mechanic.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMechanicCancel}>Cancel</Button>
          <Button 
            onClick={handleMechanicConfirm} 
            variant="contained" 
            disabled={!selectedMechanicId}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Split Service Dialog */}
      <Dialog open={splitDialogOpen} onClose={handleCloseSplitDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Split Service Time</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the number of hours to split off from this service:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Hours to split"
            type="number"
            fullWidth
            value={splitHours}
            onChange={e => setSplitHours(e.target.value)}
            error={!!splitError}
            helperText={splitError}
            inputProps={{ min: 0, step: 0.1 }}
            disabled={splitLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSplitDialog} disabled={splitLoading}>Cancel</Button>
          <Button onClick={handleConfirmSplit} variant="contained" disabled={splitLoading}>
            {splitLoading ? <CircularProgress size={24} color="inherit" /> : 'Split'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <AddServiceOrderDialog
        open={addServiceDialogOpen}
        onClose={() => setAddServiceDialogOpen(false)}
        serviceOrderId={order?.id}
        callback={handleAddService}
      />
    </Box>
  );
};

export default ServicesBlade;
