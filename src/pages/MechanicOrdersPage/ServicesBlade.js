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
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';

const ServicesBlade = ({ order, onClose, onUpdate }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState(order.services || []);
  const [mechanicDialogOpen, setMechanicDialogOpen] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [pendingServiceId, setPendingServiceId] = useState(null);
  const isAdmin = StateManager.isAdmin();

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

  const handleAddTime = (serviceId) => {
    // TODO: Implement add time functionality
    console.log('Add time for service:', serviceId);
  };

  const handleOrderPart = (serviceId) => {
    // TODO: Implement order part functionality
    console.log('Order part for service:', serviceId);
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
              <TableRow key={service.id}>
                <TableCell>
                  <IconButton
                    onClick={() => handleStatusChange(service.id, service.status === 'complete' ? 'pending' : 'complete')}
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
                {/* <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    {service.status === 'complete' ? (
                      <Tooltip title="Add Time">
                        <IconButton
                          onClick={() => handleAddTime(service.id)}
                          size="small"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <AccessTimeIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Order Part">
                        <IconButton
                          onClick={() => handleOrderPart(service.id)}
                          size="small"
                          sx={{ color: theme.palette.info.main }}
                        >
                          <ShoppingCartIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Search services..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
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
    </Box>
  );
};

export default ServicesBlade;
