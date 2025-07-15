import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Avatar, TextField, Button, Divider, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ClearIcon from '@mui/icons-material/Clear';
import { ArrowForward } from '@mui/icons-material';
import { StateManager } from '../../utilities/stateManager';

const VehiclesSection = ({ 
  loadData, 
  onUpdateField, 
  onRemoveCarOrStop, 
  onDragEnd,
  onVehicleClick, 
  onAddStops, 
  onOpenOutsideCarForm,
  updateLocalUI
}) => {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceTimer = useRef(null);
  const removeDebounceTimer = useRef(null);
  const pendingRemovals = useRef(new Set());

  const handleRemoveCar = (carId) => {
    // Add to pending removals
    pendingRemovals.current.add(carId);

    // Update local UI immediately
    const updatedCars = loadData.cars.filter(car => !pendingRemovals.current.has(car.id));
    updateLocalUI(updatedCars);

    // Clear any existing timer
    if (removeDebounceTimer.current) {
      clearTimeout(removeDebounceTimer.current);
    }

    // Set debouncing state to true
    setIsDebouncing(true);

    // Set new timer
    removeDebounceTimer.current = setTimeout(() => {
      // Get final list of cars after all pending removals
      pendingRemovals.current.clear();
      setIsDebouncing(false);
      onRemoveCarOrStop(carId);
    }, 3000);
  };

  const handleDragEnd = (result) => {
    if (!result.destination || !loadData?.cars) return;

    // If the item was dropped in the same position, do nothing
    if (result.destination.index === result.source.index) return;

    const items = Array.from(loadData.cars);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update the local state for UI responsiveness
    updateLocalUI(items);

    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set debouncing state to true
    setIsDebouncing(true);

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      setIsDebouncing(false);
      onDragEnd(items);
    }, 3000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (removeDebounceTimer.current) {
        clearTimeout(removeDebounceTimer.current);
      }
    };
  }, []);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Vehicles
          </Typography>
          {isDebouncing && (
            <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Updating route in 3 seconds...
            </Typography>
          )}
        </Box>
        {
          StateManager.isBackoffice() && 
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddStops}
              >
                Add Sold Cars
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onOpenOutsideCarForm}
              >
                Add Outside Car
              </Button>
            </Box>
          }
      </Box>
      
      {(!loadData?.cars || loadData.cars.length === 0) ? (
        <Box 
          sx={{ 
            py: 6, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            color: 'text.secondary'
          }}
        >
          <LocalShippingIcon sx={{ fontSize: 48 }} />
          <Typography variant="h6">
            No cars added to this load yet
          </Typography>
          <Typography variant="body2">
            Click "Add Stop" to start building your route
          </Typography>
        </Box>
      ) : StateManager.isBackoffice() ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="vehicles">
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {loadData.cars.map((car, index) => (
                  <Draggable
                    key={car.id || `car-${index}`}
                    draggableId={car.id || `car-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {index > 0 && <Divider sx={{ my: 2 }} />}
                        <Grid 
                          container 
                          spacing={2} 
                          alignItems="center"
                          onClick={() => onVehicleClick(car)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              borderRadius: 1
                            },
                            p: 1,
                            position: 'relative',
                            bgcolor: snapshot.isDragging ? 'action.hover' : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <Grid item xs={12} sm={6} md={5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                src={car.thumbnail} 
                                sx={{ width: 72, height: 72 }}
                                variant="rounded"
                              />
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500, textAlign: 'left'}}>
                                  {index + 1}. {car.type === 'car_delivery' ? car.id : `Outside ${car.stopType} -`} {car.carTitle || `${car.year} ${car.make} ${car.model}`}
                                </Typography>
                                {
                                  car.customerName && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left'}}>
                                      {car.customerName}
                                    </Typography>
                                  )
                                }
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left'}}>
                                  {car.address || (car.location ? `${car.location.lat}, ${car.location.lng}` : 'Address not available')}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={7}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              width: '100%',
                              gap: 2
                            }}>
                              <TextField
                                label="Shipping Charge"
                                type="number"
                                value={car.charge || ''}
                                onChange={(e) => onUpdateField('charge', e.target.value, { carId: car.id })}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                                }}
                                size="small"
                                sx={{ width: 150 }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <IconButton 
                                aria-label="remove item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCar(car.id);
                                }}
                                size="small"
                              >
                                <ClearIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Box>
          {loadData.cars.map((car, index) => (
            <React.Fragment key={car.id || `car-${index}`}>
              {index > 0 && <Divider sx={{ my: 2 }} />}
              <Grid 
                container 
                spacing={2} 
                alignItems="center"
                onClick={() => onVehicleClick(car)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  },
                  p: 1,
                  position: 'relative'
                }}
              >
                <Grid item xs={12} sm={6} md={5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={car.thumbnail} 
                      sx={{ width: 72, height: 72 }}
                      variant="rounded"
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, textAlign: 'left'}}>
                        {index + 1}. {car.type === 'car_delivery' ? car.id : `SD -`} {car.carTitle || `${car.year} ${car.make} ${car.model}`}
                      </Typography>
                      {
                        car.customerName && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left'}}>
                            {car.customerName}
                          </Typography>
                        )
                      }
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left'}}>
                        {car.address || (car.location ? `${car.location.lat}, ${car.location.lng}` : 'Address not available')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={7}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    width: '100%',
                    pr: 2
                  }}>
                    <ArrowForward color="action" />
                  </Box>
                </Grid>
              </Grid>
            </React.Fragment>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default VehiclesSection; 