import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { StateManager } from '../utilities/stateManager';
import algolia from '../utilities/algolia';
import RequestManager from '../utilities/requestManager';
import { Grid, Card, CardContent, CardMedia, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import constants from '../utilities/constants';

export default function AddServiceOrderDialog({ open, onClose, initialCar = null, serviceOrderId = null, callback = null }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [cars, setCars] = React.useState([]);
  const [selectedCar, setSelectedCar] = React.useState(initialCar);
  const [serviceDescription, setServiceDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selectedMechanic, setSelectedMechanic] = React.useState('Placeholder');
  const [selectedStatus, setSelectedStatus] = React.useState('approval');
  const [aiProcessing, setAiProcessing] = React.useState(false);

  // Set initial car when dialog opens
  React.useEffect(() => {
    if (open && initialCar) {
      setSelectedCar(initialCar);
      setSearchQuery(`${initialCar.year} ${initialCar.make} ${initialCar.model} ${initialCar.stock}`);
      setCars([initialCar]);
    } else if (!open) {
      // Reset state when dialog closes
      setSelectedCar(null);
      setSearchQuery('');
      setCars([]);
      setServiceDescription('');
      setSelectedMechanic('Placeholder');
      setSelectedStatus('approval');
      setAiProcessing(false);
    }
  }, [open, initialCar]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCars([]);
      return;
    }

    try {
      const { results } = await algolia.client.search([
        {
          indexName: 'cars',
          query: query,
          params: {
            hitsPerPage: 10,
            attributesToRetrieve: ['objectID', 'stock', 'year', 'make', 'model', 'thumbnail']
          }
        }
      ]);

      setCars(results[0].hits);
    } catch (error) {
      console.error('Error searching cars:', error);
      StateManager.setAlertAndOpen('Error searching cars', 'error');
    }
  };

  const handleCreateServiceOrder = async () => {

    if (serviceOrderId) {
      if (!serviceDescription.trim()) {
        StateManager.setAlertAndOpen('Please enter a service description', 'error');
        return;
      }
    } else {
      if (!selectedCar || !serviceDescription.trim()) {
        StateManager.setAlertAndOpen('Please select a car and enter a service description', 'error');
        return;
      }

      if (!selectedCar.objectID && !selectedCar.stock) {
        StateManager.setAlertAndOpen('Please select a car first', 'error');
        return;
      }
    }

    setLoading(true);
    setAiProcessing(true);
    try {
      let response;
      
      if (serviceOrderId) {
        // Create service for existing order
        response = await RequestManager.post({
          function: 'createServices',
          variables: {
            serviceOrderId: serviceOrderId,
            description: serviceDescription.trim()
          }
        });
      } else {
        // Create new service order
        response = await RequestManager.post({
          function: 'createServiceOrder',
          variables: {
            carId: selectedCar.objectID || selectedCar.stock,
            description: serviceDescription.trim(),
            mechanicId: selectedMechanic ? constants.mechanics.find(m => m.name === selectedMechanic)?.id : null,
            status: selectedStatus
          }
        });

        if (response.success) {
          const { orderId } = response;
          // Create Algolia record on client
          const record = {
            objectID: orderId,
            id: orderId,
            stock: orderId,
            carId: selectedCar.objectID,
            car_title: `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`,
            thumbnail: selectedCar.thumbnail,
            mechanicId: selectedMechanic ? constants.mechanics.find(m => m.name === selectedMechanic)?.id : null,
            status: selectedStatus
          };
          await algolia.createRecord("orders", record);
        }
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to create service');
      }

      if (callback) {
        callback(response.services);
      }

      StateManager.setAlertAndOpen(serviceOrderId ? 'Service added successfully' : 'Service order created successfully', 'success');
      onClose();
      if (!serviceOrderId) {
        window.location.href = `/service-order/${response.orderId}`;
      }
    } catch (error) {
      console.error('Error creating service:', error);
      StateManager.setAlertAndOpen(error.message || 'Error creating service', 'error');
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {aiProcessing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Sending to AI for estimate...</Typography>
          </Box>
        ) : (
          serviceOrderId ? `Add Service to ${serviceOrderId}` : 'Create New Service Order'
        )}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {!serviceOrderId && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Search Cars"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  margin="normal"
                  placeholder="Search by stock number, make, model..."
                  autoComplete='off'
                />
              </Grid>
              
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {cars.map((car) => (
                    <Grid item xs={12} sm={6} md={4} key={car.objectID}>
                      <Card 
                        onClick={() => {
                          setSelectedCar(car);
                          setCars([car]);
                          setSearchQuery(`${car.year} ${car.make} ${car.model} ${car.stock}`);
                        }}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedCar?.objectID === car.objectID ? '2px solid #1976d2' : 'none'
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={car.thumbnail || 'https://tools.skywayclassics.com/missing_image.jpeg'}
                          alt={`${car.year} ${car.make} ${car.model}`}
                        />
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {car.stock}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {car.year} {car.make} {car.model}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Mechanic</InputLabel>
                  <Select
                    value={selectedMechanic}
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    label="Mechanic"
                    disabled={loading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {constants.mechanics.map((mechanic) => (
                      <MenuItem key={mechanic.id} value={mechanic.name}>
                        {mechanic.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Status"
                    disabled={loading}
                  >
                    {constants.order_statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Description"
              multiline
              rows={4}
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              margin="normal"
              placeholder="Describe what needs to be fixed..."
              disabled={loading}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleCreateServiceOrder} 
          variant="contained" 
          color="primary"
          disabled={loading || (!serviceOrderId && !selectedCar) || !serviceDescription.trim()}
        >
          {loading ? <CircularProgress size={24} /> : (serviceOrderId ? 'Add Service' : 'Create Service Order')}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 