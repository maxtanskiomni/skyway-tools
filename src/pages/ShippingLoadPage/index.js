import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Box, Typography, Container, Grid, Paper, Avatar, AvatarGroup, TextField, Button, Divider, useTheme, Select, MenuItem, FormControl, InputLabel, IconButton, Dialog, DialogContent, DialogActions, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useParams, useHistory } from 'react-router-dom';

import RequestManager from '../../utilities/requestManager';
import { StateManager } from '../../utilities/stateManager';
import firebase from '../../utilities/firebase';
import DeleteIcon from '@mui/icons-material/Delete';
import LoadSelector from './LoadSelector';
import AddOutsideCarForm from './AddOutsideCarForm';
import FinancialDetails from './FinancialDetails';
import VehicleDetailsDialog from './VehicleDetailsDialog';
import VehiclesSection from './VehiclesSection';
import RouteSection from './RouteSection';


const driverCostPerMile = {
  'Scott Bivens': 0.63,
  'Clarence Bowens': 0.65,
  'Steve McIntosh': 0.50,
  'Porters': 0.00,
  'Outside Vendor': 0.00
}


const ShippingLoadPage = () => {
  const { loadId } = useParams();
  const history = useHistory();
  StateManager.setTitle(`Load Number ${loadId}`);
  const [loadData, setLoadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [isLoadSelectorOpen, setIsLoadSelectorOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [isAddOutsideCarFormOpen, setIsAddOutsideCarFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRouteUpdating, setIsRouteUpdating] = useState(false);

  // Add state for start and end locations
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);



  useEffect(() => {
    const fetchLoadData = async () => {
      StateManager.setLoading(true);
      try {
        const loadDoc = await firebase.firestore().collection('shipping-loads').doc(loadId).get();
        
        if (loadDoc.exists) {
          const loadData = loadDoc.data();
          setLoadData(loadData);
          const newMarkers = loadData.cars
            .filter(car => car?.location?.lat && car?.location?.lng)
            .map(car => ({
              position: {
                lat: car.location.lat,
                lng: car.location.lng
              },
              car: car
            }));
          setMarkers(newMarkers);
        } else {
          StateManager.setAlertAndOpen("Error fetching load details", "error");
        }
      } catch (error) {
        console.error('Error fetching load details:', error);
        StateManager.setAlertAndOpen("Error fetching load details", "error");
      } finally {
        setLoading(false);
        StateManager.setLoading(false);
      }
    };

    if (loadId) {
      fetchLoadData();
    }
  }, [loadId]);

  useEffect(() => {
    if (mapInstance && markers && markers.length > 0 && window.google && window.google.maps) {
      if (markers.length === 1) {
        mapInstance.panTo(markers[0].position);
        mapInstance.setZoom(14);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(marker.position);
        });
        mapInstance.fitBounds(bounds);
      }
    }
  }, [mapInstance, markers]);

  // Add effect to geocode start and end addresses when they change
  useEffect(() => {
    const geocodeAddress = async (address) => {
      if (!address || !window.google || !window.google.maps || !window.google.maps.Geocoder) return null;
      
      const geocoder = new window.google.maps.Geocoder();
      try {
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].geometry.location);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
        return {
          lat: result.lat(),
          lng: result.lng()
        };
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    };

    const updateLocations = async () => {
      if (loadData?.start) {
        const startLoc = await geocodeAddress(loadData.start);
        setStartLocation(startLoc);
      } else {
        setStartLocation(null);
      }

      if (loadData?.end) {
        const endLoc = await geocodeAddress(loadData.end);
        setEndLocation(endLoc);
      } else {
        setEndLocation(null);
      }
    };

    updateLocations();
  }, [loadData?.start, loadData?.end]);

  const handleUpdateField = async (fieldName, fieldValue, options = {}) => {
    if (!loadId) {
      StateManager.setAlertAndOpen("Load ID is missing. Cannot update field.", "error");
      return;
    }

    const { carId } = options;
    let updatedLoadData = { ...loadData };
    let dataToUpdate = {};

    if (fieldName === 'charge' && carId) {
      updatedLoadData.cars = (updatedLoadData.cars || []).map(car =>
        car.id === carId ? { ...car, charge: parseFloat(fieldValue) || 0 } : car
      );
      dataToUpdate.cars = updatedLoadData.cars;
    } else if (fieldName === 'driver') {
      updatedLoadData.driver = fieldValue;
      dataToUpdate.driver = fieldValue;
      const costPerMile = driverCostPerMile[fieldValue] || 0;
      updatedLoadData.cost_per_mile = costPerMile;
      dataToUpdate.cost_per_mile = costPerMile;
    } else if (fieldName === 'cars' && carId && options.updates) {
      updatedLoadData.cars = (updatedLoadData.cars || []).map(car =>
        car.id === carId ? {   ...car, ...options.updates } : car
      );
      dataToUpdate.cars = updatedLoadData.cars;
    } else {
      updatedLoadData[fieldName] = fieldValue;
      dataToUpdate[fieldName] = fieldValue;
    }

    setLoadData(updatedLoadData);

    try {
      const loadDocRef = firebase.firestore().collection('shipping-loads').doc(loadId);
      await loadDocRef.update(dataToUpdate);
    } catch (error) {
      console.error(`Error updating ${fieldName} in Firebase:`, error);
      StateManager.setAlertAndOpen(`Error updating ${fieldName}. Please try again.`, "error");
    }
  };

  const handleAddStops = () => {
    setIsLoadSelectorOpen(true);
  };

  const handleLoadSelectorClose = () => {
    setIsLoadSelectorOpen(false);
  };

  const handleLoadSelected = async (carsForLoad) => {
    handleLoadSelectorClose();
    
    // Create a map of existing charges from current loadData
    const existingCharges = {};
    if (loadData?.cars) {
      loadData.cars.forEach(car => {
        if (car.type === 'car_delivery' && car.charge) {
          existingCharges[car.id] = car.charge;
        }
      });
    }

    // Preserve existing charges in the new selection
    const carsWithPreservedCharges = carsForLoad.map(car => ({
      ...car,
      charge: existingCharges[car.id] || car.charge || 0
    }));

    // Call handleNewStops with the updated cars
    await handleNewStops(carsWithPreservedCharges);
  }

  const handleNewStops = async (newStops, reset = false, optimizeWaypoints = false) => {
    handleLoadSelectorClose();
    setIsRouteUpdating(true);

    const stops = reset ? newStops : [...new Map([...(loadData?.cars || []), ...newStops].map(car => [car.id, car])).values()];

    try {
      const response = await RequestManager.post({
        function: 'addCarsToLoad',
        variables: {
          loadId,
          stops,
          optimizeWaypoints
        }
      });

      if (response.success) {
        setLoadData(response.load);
        const newMarkers = response.load.cars
          .filter(car => car?.location?.lat && car?.location?.lng)
          .map(car => ({
            position: {
              lat: car.location.lat,
              lng: car.location.lng
            },
            car: car
          }));
        setMarkers(newMarkers);
        StateManager.setAlertAndOpen("Stops updated successfully", "success");
      } else {
        throw new Error("Failed to update stops");
      }
    } catch (error) {
      console.error('Error updating stops:', error);
      StateManager.setAlertAndOpen("Error updating stops", "error");
    } finally {
      setIsRouteUpdating(false);
    }
  };

  const handleOpenOutsideCarForm = () => {
    setIsAddOutsideCarFormOpen(true);
  };

  const handleCloseOutsideCarForm = () => {
    setIsAddOutsideCarFormOpen(false);
  };

  const handleOutsideCarSubmit = async (outsideCarData) => {
    if (!loadData) {
      StateManager.setAlertAndOpen("Load data not available. Cannot add outside car.", "error");
      return;
    }
    
    const newCarStop = {
      ...outsideCarData, 
    };

    const updatedCars = [...(loadData.cars || []), newCarStop];

    const newOutsideStops = updatedCars.filter(car => car.type === 'outside_stop');
    
    try {
      // Step 1: Persist the new car to Firebase and optimistically update local state.
      await handleUpdateField('cars', updatedCars);

      await handleNewStops(newOutsideStops); 

    } catch (error) {
      console.error("Error during outside car submission process:", error);
    }
  };

  const handleRemoveCarOrStop = async (itemIdToRemove) => {
    if (!loadData || !loadData.cars) {
      StateManager.setAlertAndOpen("Cannot remove item: Load data is missing.", "error");
      return;
    }

    const updatedCars = loadData.cars.filter(car => car.id !== itemIdToRemove);

    // Optimistically update the local state for UI responsiveness
    setLoadData(prevLoadData => ({
      ...prevLoadData,
      cars: updatedCars
    }));
    try {
      await handleNewStops(updatedCars, true); // Pass empty to signify it should use current state
    } catch (error) {
      console.error('Error after removing item and calling handleNewStops:', error);
    }
  };

  const handleDragEnd = async (updatedCars) => {
    if (!loadData || !loadData.cars) {
      StateManager.setAlertAndOpen("Cannot update order: Load data is missing.", "error");
      return;
    }

    try {   
      await handleNewStops(updatedCars, true, false);
    } catch (error) {
      console.error('Error updating route after drag:', error);
      StateManager.setAlertAndOpen("Error updating route after reordering", "error");
    }
  };

  const handleUpdateOrderLocally = async (updatedCars) => {
    setLoadData(prevLoadData => ({
      ...prevLoadData,
      cars: updatedCars
    }));
    setIsRouteUpdating(true);
  };

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  // Add this new function to handle vehicle selection
  const handleVehicleClick = async (car) => {
    setSelectedVehicle(car);
    setIsVehicleDialogOpen(true);
  };

  const handleDeleteLoad = async () => {
    try {
      StateManager.setLoading(true);
      await firebase.firestore().collection('shipping-loads').doc(loadId).delete();
      StateManager.setAlertAndOpen("Load deleted successfully", "success");
      history.push('/shipping-dashboard');
    } catch (error) {
      console.error('Error deleting load:', error);
      StateManager.setAlertAndOpen("Error deleting load", "error");
    } finally {
      StateManager.setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Admin Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Load #{loadId}
            </Typography>
            {StateManager.isBackoffice() &&
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Load
              </Button>
            }
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={loadData?.status || ''}
                  label="Status"
                  onChange={(e) => handleUpdateField('status', e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Created Date"
                value={loadData?.created_at ? new Date(loadData.created_at).toLocaleString() : 'N/A'}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Departure Date"
                  value={loadData?.departure_date ? new Date(loadData.departure_date) : null}
                  onChange={(date) => handleUpdateField('departure_date', date ? date.toISOString() : null)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Completion Date"
                  value={loadData?.completed_at ? new Date(loadData.completed_at) : null}
                  onChange={(date) => handleUpdateField('completed_at', date ? date.toISOString() : null)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={loadData?.driver ?? ''}
                  label="Driver"
                  onChange={async (e) => {
                    const selectedDriver = e.target.value;
                    const costPerMile = driverCostPerMile[selectedDriver] || 0.65;
                    
                    try {
                      // Update local state first
                      const updatedLoadData = {
                        ...loadData,
                        driver: selectedDriver,
                        cost_per_mile: costPerMile
                      };
                      setLoadData(updatedLoadData);
                      
                      // Then update in Firebase
                      await handleUpdateField('driver', selectedDriver);
                    } catch (error) {
                      console.error('Error updating driver:', error);
                      // Revert local state if Firebase update fails
                      setLoadData(loadData);
                      StateManager.setAlertAndOpen("Error updating driver", "error");
                    }
                  }}
                >
                  <MenuItem value="">Select Driver</MenuItem>
                  <MenuItem value="Scott Bivens">Scott Bivens</MenuItem>
                  <MenuItem value="Steve McIntosh">Steve McIntosh</MenuItem>
                  <MenuItem value="Clarence Bowens">Clarence Bowens</MenuItem>
                  <MenuItem value="Porters">Porters</MenuItem>
                  <MenuItem value="Outside Vendor">Outside Vendor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Location"
                value={loadData?.start || ''}
                onChange={(e) => handleUpdateField('start', e.target.value)}
                placeholder="Enter start location (e.g., address, city, zip)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Location"
                value={loadData?.end || ''}
                onChange={(e) => handleUpdateField('end', e.target.value)}
                placeholder="Enter end location (e.g., address, city, zip)"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Vehicles Section */}
        <VehiclesSection 
          loadData={loadData}
          onUpdateField={handleUpdateField}
          onRemoveCarOrStop={handleRemoveCarOrStop}
          onVehicleClick={handleVehicleClick}
          onAddStops={handleAddStops}
          onOpenOutsideCarForm={handleOpenOutsideCarForm}
          onDragEnd={handleDragEnd}
          updateLocalUI={handleUpdateOrderLocally}
        />

        {/* Route Section */}
        <RouteSection
          loadData={loadData}
          mapInstance={mapInstance}
          setMapInstance={setMapInstance}
          markers={markers}
          startLocation={startLocation}
          endLocation={endLocation}
          isRouteUpdating={isRouteUpdating}
        />

        {/* Financial Details Section */}
        {StateManager.isBackoffice() &&
          <FinancialDetails 
            loadData={loadData}
            onUpdateField={handleUpdateField}
          />
        }

        {/* Load Selector Dialog */}
        <Dialog
          open={isLoadSelectorOpen}
          onClose={handleLoadSelectorClose}
          maxWidth="xl"
          fullWidth
        >
          <DialogContent sx={{ height: '80vh', p: 0 }}>
            <LoadSelector 
              onLoadCreated={handleLoadSelected} 
              initialSelection={{
                selectedCars: loadData?.cars?.filter(car => car.type === 'car_delivery').map(car => car.id) || []
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLoadSelectorClose}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Add Outside Car Form Dialog */}
        <AddOutsideCarForm 
          open={isAddOutsideCarFormOpen}
          onClose={handleCloseOutsideCarForm}
          onSubmit={handleOutsideCarSubmit}
        />

        <VehicleDetailsDialog
          open={isVehicleDialogOpen}
          onClose={() => {
            setIsVehicleDialogOpen(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
          loadId={loadId}
          onUpdateField={handleUpdateField}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Delete Load
            </Typography>
            <Typography>
              Are you sure you want to delete this load? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteLoad} 
              color="error" 
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ShippingLoadPage;
