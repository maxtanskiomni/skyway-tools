import React, { useState, useEffect, useCallback, useRef } from 'react';
import { makeStyles } from '@mui/styles';
import { 
  Typography, 
  Paper,
  CircularProgress,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RequestManager from '../../utilities/requestManager';
import { StateManager } from '../../utilities/stateManager';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import firebase from '../../utilities/firebase';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createLoadButton: {
    height: '48px',
    minWidth: '200px',
  },
  content: {
    display: 'flex',
    gap: theme.spacing(2),
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    height: '100%',
    minHeight: 0,
  },
  listContainer: {
    width: '350px',
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
  },
  listHidden: {
    display: 'none',
  },
  toggleButton: {
    position: 'absolute',
    left: '350px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    backgroundColor: 'white',
    minWidth: '40px',
    width: '40px',
    height: '40px',
    borderRadius: '0 20px 20px 0',
    boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
    '&:hover': {
      backgroundColor: 'white',
    },
  },
  toggleButtonHidden: {
    left: 0,
  },
  listItem: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    transition: 'background-color 0.2s ease',
  },
  selectedItem: {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  selectButton: {
    backgroundColor: theme.palette.success.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
    width: 36,
    height: 36,
    minWidth: 36,
  },
  removeButton: {
    backgroundColor: theme.palette.error.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
    width: 36,
    height: 36,
    minWidth: 36,
  },
  thumbnail: {
    width: 60,
    height: 45,
    objectFit: 'cover',
    borderRadius: 4,
    marginRight: theme.spacing(2),
  },
  searchField: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
}));

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

const customMarkerIcon = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#FF4B4B",
  fillOpacity: 1,
  strokeWeight: 1,
  strokeColor: "#FFFFFF",
  scale: 1.5,
  anchor: { x: 12, y: 24 },
};

const selectedMarkerIcon = {
  ...customMarkerIcon,
  fillColor: "#4CAF50",
};

const skywayLocations = {
  "FL": "10420 Portal Crossing, Sarasota, FL 34211",
  "DAL": "14805 Venture Dr, Farmers Branch, TX 75234",
}

const ShippingDashboard = ({ onLoadCreated, initialSelection = { selectedCars: [] } }) => {
  const classes = useStyles();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedCars, setSelectedCars] = useState(new Set(initialSelection.selectedCars));
  const [listVisible, setListVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [markingAsShipped, setMarkingAsShipped] = useState(new Set());
  const hoverTimeoutRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['geometry', 'geocoding']
  });

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await RequestManager.get({
          function: 'getCarsNeedingShipping'
        });
        if(response.success){ 
          // Filter out duplicate cars based on car.id
          const uniqueCars = response.data.filter((car, index, self) => 
            index === self.findIndex(c => c.id === car.id)
          );
          
          const sortedCars = uniqueCars.sort((a, b) => {
            const stateA = a.customer.state || '';
            const stateB = b.customer.state || '';
            return stateA.localeCompare(stateB);
          });
          setCars(sortedCars);
          console.log(sortedCars);
          
          const newMarkers = sortedCars
            .filter(car => car?.location?.lat && car?.location?.lng)
            .map(car => ({
              position: {
                lat: car.location.lat,
                lng: car.location.lng
              },
              car: car
            }));
          setMarkers(newMarkers);

          // After fetching cars, ensure any initially selected cars are still selected
          const validSelectedCars = new Set(
            initialSelection.selectedCars.filter(id => 
              sortedCars.some(car => car.id === id)
            )
          );
          setSelectedCars(validSelectedCars);
        } else {
          throw new Error("Error fetching cars");
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        StateManager.setAlertAndOpen("Error fetching cars", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [initialSelection.selectedCars]);

  const handleCarSelect = (car) => {
    const newSelectedCars = new Set(selectedCars);
    if (newSelectedCars.has(car.id)) {
      newSelectedCars.delete(car.id);
    } else {
      newSelectedCars.add(car.id);
    }
    setSelectedCars(newSelectedCars);
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    handleCarSelect(marker.car);
  };

  const handleMarkerHover = (marker) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setSelectedMarker(marker);
    }, 100);
  };

  const handleMarkerLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setSelectedMarker(null);
    }, 300);
  };

  const handleInfoWindowMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleInfoWindowMouseLeave = () => {
    handleMarkerLeave();
  };

  const handleCreateLoad = async () => {
    try {
      if (onLoadCreated) {
        // Mark all selected cars as shipped
        const updatePromises = Array.from(selectedCars).map(carId =>
          firebase.firestore().doc(`deals/${carId}`).set({
            shipping_complete: true,
            shipping_status: 'complete'
          }, { merge: true })
        );
        
        await Promise.all(updatePromises);

        const carsForLoad = Array.from(selectedCars).map(id => {
          const car = cars.find(car => car.id === id);
          return {
            id: car.id,
            carTitle: car.car.title,
            thumbnail: car.car.thumbnail,
            customerId: car.buyer || car.cobuyer || null,
            customerName: car.customer.name,
            pickup: skywayLocations[car.location] || null,
            address: `${car.customer.address1} ${car.customer.city}, ${car.customer.state} ${car.customer.zip}`,
            location: car.location,
            type: 'car_delivery',
            stopType: 'dropoff'
          }
        });

        onLoadCreated(carsForLoad);
      } else {
        console.warn("LoadSelector: onLoadCreated prop is not provided.");
      }
    } catch (error) {
      console.error('Error in LoadSelector handleCreateLoad:', error);
      StateManager.setAlertAndOpen("Error creating load", "error");
    }
  };

  const handleThumbnailClick = (carId, event) => {
    event.stopPropagation(); // Prevent triggering the list item click
    window.open(`/car/${carId}`, '_blank');
  };

  const handleMarkAsShipped = async (carId, event) => {
    event.stopPropagation(); // Prevent triggering the list item click
    
    try {
      setMarkingAsShipped(prev => new Set(prev).add(carId));
      
      // Update the deals table to set shipping_complete to true
      await firebase.firestore().doc(`deals/${carId}`).set({
        shipping_complete: true,
        shipping_status: 'complete'
      }, { merge: true });
      
      // Remove the car from the local state
      setCars(prevCars => prevCars.filter(car => car.id !== carId));
      setMarkers(prevMarkers => prevMarkers.filter(marker => marker.car.id !== carId));
      
      // Remove from selected cars if it was selected
      setSelectedCars(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(carId);
        return newSelected;
      });
      
      StateManager.setAlertAndOpen("Car marked as shipped successfully!", "success");
    } catch (error) {
      console.error('Error marking car as shipped:', error);
      StateManager.setAlertAndOpen("Error marking car as shipped", "error");
    } finally {
      setMarkingAsShipped(prev => {
        const newSet = new Set(prev);
        newSet.delete(carId);
        return newSet;
      });
    }
  };

  const filteredCars = cars.filter(car => {
    const searchLower = searchQuery.toLowerCase();
    return (
      car.id.toLowerCase().includes(searchLower) ||
      car.car.title.toLowerCase().includes(searchLower) ||
      car.customer.name.toLowerCase().includes(searchLower) ||
      (car.customer.address1 && car.customer.address1.toLowerCase().includes(searchLower)) ||
      (car.customer.city && car.customer.city.toLowerCase().includes(searchLower)) ||
      (car.customer.state && car.customer.state.toLowerCase().includes(searchLower)) ||
      (car.customer.zip && car.customer.zip.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box>
          <Typography variant="h4">
            Load Selector
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {cars.length} cars available for shipping
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          className={classes.createLoadButton}
          onClick={handleCreateLoad}
          disabled={selectedCars.size === 0}
          startIcon={<LocalShippingIcon />}
        >
          Add to load ({selectedCars.size})
        </Button>
      </Box>

      <Box className={classes.content}>
        {listVisible && (
          <Paper className={classes.listContainer}>
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Delivery Stops ({selectedCars.size} selected)
              </Typography>
              <TextField
                className={classes.searchField}
                placeholder="Search cars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {filteredCars.map((car) => (
                <React.Fragment key={car.id}>
                  <ListItem 
                    className={`${classes.listItem} ${selectedCars.has(car.id) ? classes.selectedItem : ''}`}
                    onClick={() => handleCarSelect(car)}
                  >
                    {car.car.thumbnail && (
                      <ListItemAvatar>
                        <img 
                          src={car.car.thumbnail} 
                          alt={car.car.title}
                          className={classes.thumbnail}
                          onClick={(e) => handleThumbnailClick(car.id, e)}
                          style={{ cursor: 'pointer' }}
                        />
                      </ListItemAvatar>
                    )}
                    <ListItemText
                      primary={`${car.id} ${car.car.title}`}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {car.customer.name}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="textSecondary">
                            {car.customer.address1}
                            {car.customer.city && <>, {car.customer.city}</>}
                            {car.customer.state && <>, {car.customer.state}</>}
                            {car.customer.zip && <> {car.customer.zip}</>}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        onClick={(e) => handleMarkAsShipped(car.id, e)}
                        disabled={markingAsShipped.has(car.id)}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        {markingAsShipped.has(car.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Remove from Map'
                        )}
                      </Button>
                      <IconButton
                        className={selectedCars.has(car.id) ? classes.removeButton : classes.selectButton}
                        size="small"
                      >
                        {selectedCars.has(car.id) ? <RemoveIcon /> : <AddIcon />}
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        <IconButton
          className={`${classes.toggleButton} ${!listVisible ? classes.toggleButtonHidden : ''}`}
          onClick={() => setListVisible(!listVisible)}
          size="small"
        >
          {listVisible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        {isLoaded ? (
          <Paper className={classes.mapContainer}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={4}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                zoomControl: true,
                streetViewControl: true,
                mapTypeControl: true,
                fullscreenControl: true,
                gestureHandling: 'greedy'
              }}
            >
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                  onMouseOver={() => handleMarkerHover(marker)}
                  onMouseOut={handleMarkerLeave}
                  icon={selectedCars.has(marker.car.id) ? selectedMarkerIcon : customMarkerIcon}
                />
              ))}

              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                  options={{
                    pixelOffset: new window.google.maps.Size(0, -40),
                    disableAutoPan: true
                  }}
                >
                  <div 
                    onMouseEnter={handleInfoWindowMouseEnter}
                    onMouseLeave={handleInfoWindowMouseLeave}
                  >
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {selectedMarker.car.id} {selectedMarker.car.car.title}
                    </Typography>
                    {selectedMarker.car.car.thumbnail && (
                      <img 
                        src={selectedMarker.car.car.thumbnail} 
                        alt={selectedMarker.car.car.title}
                        style={{ 
                          width: '200px', 
                          height: '150px', 
                          objectFit: 'cover', 
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => handleThumbnailClick(selectedMarker.car.id, e)}
                      />
                    )}
                    <Typography variant="body2">
                      {selectedMarker.car.customer.name}
                    </Typography>
                    <Typography variant="body2">
                      {selectedMarker.car.customer.address1}
                      {selectedMarker.car.customer.city && <>, {selectedMarker.car.customer.city}</>}
                      {selectedMarker.car.customer.state && <>, {selectedMarker.car.customer.state}</>}
                      {selectedMarker.car.customer.zip && <> {selectedMarker.car.customer.zip}</>}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        onClick={(e) => handleMarkAsShipped(selectedMarker.car.id, e)}
                        disabled={markingAsShipped.has(selectedMarker.car.id)}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        {markingAsShipped.has(selectedMarker.car.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Remove from Map'
                        )}
                      </Button>
                    </Box>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </Paper>
        ) : (
          <CircularProgress />
        )}
      </Box>
    </Box>
  );
};

export default ShippingDashboard; 