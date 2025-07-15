import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckBox,
  CheckBoxOutlineBlank,
  Add as AddIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import history from '../../utilities/history';
import Blade from '../../components/Blade';
import ServiceEditForm from './ServiceEditForm';
import RequestManager from '../../utilities/requestManager';

const headers = [
  { key: 'isComplete', label: 'Complete', align: 'center' },
  { key: 'name', label: 'Service', align: 'left' },
  { key: 'mechanicName', label: 'Mechanic', align: 'left' },
  { key: 'time', label: 'Hours', align: 'right' },
  { key: 'cost', label: 'Cost', format: 'usd', align: 'right' },
  { key: 'actions', label: '', align: 'center' }
];

const ServiceItemsTable = ({ items = [], stockNumber, disabled }) => {
  const [services, setServices] = React.useState(items);
  const [selectedService, setSelectedService] = React.useState(null);
  const [bladeOpen, setBladeOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newServiceText, setNewServiceText] = React.useState('');

  React.useEffect(() => {
    setServices(items);
  }, [items]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setBladeOpen(true);
  };

  const handleBladeClose = () => {
    setBladeOpen(false);
    setSelectedService(null);
  };

  const handleServiceUpdate = async (updates) => {
    if (!selectedService) return;
    
    try {
      await firebase.firestore().collection('services').doc(selectedService.id).update(updates);
      
      // Update local state
      const updatedServices = services.map(s => 
        s.id === selectedService.id ? { ...s, ...updates } : s
      );
      setServices(updatedServices);
      setSelectedService({ ...selectedService, ...updates });
      StateManager.setAlertAndOpen('Service updated successfully', 'success');
    } catch (error) {
      console.error('Error updating service:', error);
      StateManager.setAlertAndOpen('Error updating service', 'error');
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await firebase.firestore().collection('services').doc(service.id).delete();
      setServices(services.filter(s => s.id !== service.id));
      StateManager.setAlertAndOpen('Service deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting service:', error);
      StateManager.setAlertAndOpen('Error deleting service', 'error');
    }
  };

  const handleToggleComplete = async (service) => {
    try {
      const updates = {
        isComplete: !service.isComplete,
        completeDate: !service.isComplete ? new Date().toISOString() : null
      };
      
      await firebase.firestore().collection('services').doc(service.id).update(updates);
      
      setServices(services.map(s => 
        s.id === service.id ? { ...s, ...updates } : s
      ));
    } catch (error) {
      console.error('Error toggling service completion:', error);
      StateManager.setAlertAndOpen('Error updating service status', 'error');
    }
  };

  const handleAddServiceClick = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewServiceText('');
  };

  const handleCreateService = async () => {
    if (!newServiceText.trim()) {
      StateManager.setAlertAndOpen('Service description cannot be empty', 'error');
      return;
    }

    try {
      const response = await RequestManager.post({
        function: 'createServices',
        variables: {
          stockNumber,
          text: newServiceText.trim()
        }
      });

      if (response.success) {
        StateManager.setAlertAndOpen('Service created successfully', 'success');
        handleDialogClose();
        // Refresh the services list
        const url = new URL(window.location.href);
        const redirect = url.pathname;
        const destination = `/form/order-services?order=${stockNumber}&stock=${stockNumber}&redirect=${redirect}`;
        history.push(destination);
      } else {
        throw new Error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      StateManager.setAlertAndOpen('Error creating service', 'error');
    }
  };

  const totalHours = services.reduce((sum, service) => sum + (service.time || 0), 0);
  const totalCost = services.reduce((sum, service) => sum + (service.cost || 0), 0);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          pb: 0
        }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
            <BuildIcon /> Services
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddServiceClick}
            disabled={disabled}
          >
            Add Services
          </Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map(header => (
                <TableCell 
                  key={header.key}
                  align={header.align}
                >
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {services.sort((a, b) => (b.status || "pending").localeCompare(a.status || "pending)")).map((service) => (
              <TableRow 
                key={service.id}
                onClick={() => handleServiceClick(service)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell align="center">
                  <Checkbox
                    checked={service.status === "complete"}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(service);
                    }}
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell align="left">{service.name}</TableCell>
                <TableCell align="left">{service.mechanicName}</TableCell>
                <TableCell align="right">{service.time || 0}</TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(service.cost || 0)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(service)}
                        disabled={disabled}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ '& td': { borderTop: 2, borderColor: 'divider' } }}>
              <TableCell colSpan={2} align="right">
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Totals:</Typography>
              </TableCell>
              <TableCell />
              <TableCell align="right">
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{totalHours}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalCost)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Services</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a list of new service items to add to this order. Each line/item will be created as a separate service item.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Service Description"
            fullWidth
            multiline
            rows={8}
            value={newServiceText}
            onChange={(e) => setNewServiceText(e.target.value)}
            sx={{ 
              '& .MuiInputBase-root': {
                fontSize: '1.1rem',
                minHeight: '200px'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreateService} 
            variant="contained" 
            color="primary"
            size="large"
          >
            Add Services
          </Button>
        </DialogActions>
      </Dialog>

      <Blade open={bladeOpen} onClose={handleBladeClose} title="Edit Service">
        {selectedService && (
          <ServiceEditForm 
            service={selectedService} 
            onUpdate={handleServiceUpdate}
          />
        )}
      </Blade>
    </Box>
  );
};

export default ServiceItemsTable; 