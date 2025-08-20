import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Button,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CarLine from '../../components/CarLine';
import firebase from '../../utilities/firebase';
import constants from '../../utilities/constants';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment';

export default function InventoryPage() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [totalValue, setTotalValue] = useState(0);

  // Set page title
  useEffect(() => {
    StateManager.setTitle('Inventory');
  }, []);

  // Fetch cars from Firebase
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const carsRef = firebase.firestore().collection('cars');
        const snapshot = await carsRef.get();
        
        const carsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Process car data similar to ListPage
            publish_status: data.remove_date ? "Removed" : data.publish_date ? "Published" : "Not Live",
            price: data.price || "No Price",
            originalPrice: data.price || 0, // Store original price for calculations
            miles: data.miles || "No miles",
            hasTitle: data.title_front || "No title",
            consignor: data.consignor || "No consignor",
            isRonCar: data.consignor === "4ed13115-1900-41d2-a14d-13f1242dd48a" && "Ron car",
            vin: data.vin || "No ID",
            picture: data.thumbnail || "No pictures",
            ext_images: data.ext_images || "No exterior pictures",
            interior_images: data.interior_images || "No interior pictures",
            odometer_images: data.odometer_images || "No odometer pictures",
            vin_image: data.vin_image || "No vin pictures",
            engine_images: data.engine_images || "No engine pictures",
            stamping_images: data.stamping_images || "No stamping pictures",
            under_images: data.under_images || "No under pictures",
            video: data.youtube_link || "No video",
            writeup: data.writeup || "No writeup",
            nto: data.nto || "No NTO",
            market_price: data?.pricing?.excellent || null,
            overpriced: (data.price || 0) > 1.1*(data?.pricing?.excellent || 10000000) ? "overpriced": "",
            "days-in-stock": moment().diff(moment(data.date), 'days')
          };
        });

        // Filter for the specified statuses
        const validStatuses = ['intake', 'marketing', 'active', 'success'];
        const filteredCars = carsData.filter(car => validStatuses.includes(car.status));
        
        // Sort by stock number
        const sortedCars = filteredCars.sort((a, b) => 
          +(b.stock?.replace(/\D/g, "") || 0) - +(a.stock?.replace(/\D/g, "") || 0)
        );

        setCars(sortedCars);
        setFilteredCars(sortedCars);
        
        // Calculate total value
        const total = sortedCars.reduce((sum, car) => {
          const price = parseFloat(car.originalPrice) || 0;
          return sum + price;
        }, 0);
        setTotalValue(total);
        
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Filter cars based on search term, location, and days in inventory
  useEffect(() => {
    let filtered = cars;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(car => 
        Object.values(car).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(term)
        ) ||
        car.stock?.toLowerCase().includes(term) ||
        car.year?.toString().includes(term) ||
        car.make?.toLowerCase().includes(term) ||
        car.model?.toLowerCase().includes(term) ||
        car.vin?.toLowerCase().includes(term)
      );
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(car => car.location === selectedLocation);
    }

    // Filter by days in inventory
    if (daysFilter) {
      const daysInStock = parseInt(daysFilter);
      if (!isNaN(daysInStock)) {
        filtered = filtered.filter(car => {
          const carDays = parseInt(car["days-in-stock"]) || 0;
          return carDays >= daysInStock;
        });
      }
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(car => car.status === selectedStatus);
    }

    setFilteredCars(filtered);
  }, [cars, searchTerm, selectedLocation, daysFilter, selectedStatus]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedStatus('');
    setDaysFilter('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'intake': return 'default';
      case 'marketing': return 'primary';
      case 'active': return 'success';
      case 'success': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusCount = (status) => {
    return filteredCars.filter(car => car.status === status).length;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {searchTerm || selectedLocation || selectedStatus || daysFilter ? 'Filtered Vehicles' : 'Total Vehicles'}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {searchTerm || selectedLocation || daysFilter ? 'Filtered Vehicles' : 'Total Vehicles'}
              </Typography>
              <Typography variant="h4">
                {filteredCars.length}
              </Typography>
              {(searchTerm || selectedLocation || selectedStatus || daysFilter) && (
                <Typography variant="body2" color="text.secondary">
                  of {cars.length} total
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {searchTerm || selectedLocation || daysFilter ? 'Filtered Value' : 'Total Value'}
              </Typography>
              <Typography variant="h4">
                ${filteredCars.reduce((sum, car) => {
                  const price = parseFloat(car.originalPrice) || 0;
                  return sum + price;
                }, 0).toLocaleString()}
              </Typography>
              {(searchTerm || selectedLocation || selectedStatus || daysFilter) && (
                <Typography variant="body2" color="text.secondary">
                  of ${totalValue.toLocaleString()} total
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Listings
              </Typography>
              <Typography variant="h4">
                {getStatusCount('active')}
              </Typography>
              {(searchTerm || selectedLocation || selectedStatus || daysFilter) && (
                <Typography variant="body2" color="text.secondary">
                  of {cars.filter(car => car.status === 'active').length} total
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Intake/Marketing
              </Typography>
              <Typography variant="h4">
                {getStatusCount('marketing') + getStatusCount('intake')}
              </Typography>
              {(searchTerm || selectedLocation || selectedStatus || daysFilter) && (
                <Typography variant="body2" color="text.secondary">
                  of {(cars.filter(car => car.status === 'marketing').length + cars.filter(car => car.status === 'intake').length)} total
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['intake', 'marketing', 'active', 'success'].map(status => (
            <Chip
              key={status}
              label={`${status.toUpperCase()}: ${getStatusCount(status)}`}
              color={getStatusColor(status)}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Vehicles"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by stock, VIN, make, model, year..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                label="Location"
                onChange={handleLocationChange}
                startAdornment={
                  <InputAdornment position="start">
                    <LocationOnIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>All Locations</em>
                </MenuItem>
                {constants.locations.map(location => (
                  <MenuItem key={location.value} value={location.value}>
                    {location.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                <MenuItem value="intake">Intake</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="success">Success</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Min Days in Inventory"
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              placeholder="e.g., 30"
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary">
                      ≥
                    </Typography>
                  </InputAdornment>
                ),
                endAdornment: daysFilter && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setDaysFilter('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              disabled={!searchTerm && !selectedLocation && !selectedStatus && !daysFilter}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Vehicles ({filteredCars.length} of {cars.length})
        </Typography>
        {(searchTerm || selectedLocation || selectedStatus || daysFilter) && (
          <Typography variant="body2" color="text.secondary">
            Filtered results
          </Typography>
        )}
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Header for car list */}
          <div style={{
            backgroundColor: 'white', 
            padding: '17px',
            marginBottom: '3px', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between',
          }}>
            <div style={{width: "120px"}}>
              <Typography align="left">
                <b style={{textDecoration: "underline"}}></b>
              </Typography>
            </div>
            <div style={{width: "45%"}}>
              <Typography align="left">
                <b style={{textDecoration: "underline"}}></b>
              </Typography>
            </div>
            <div style={{width: "12%"}}>
              <Typography align="right">
                <b style={{textDecoration: "underline"}}>Market Price</b>
              </Typography>
            </div>
            <div style={{width: "12%"}}>
              <Typography align="right">
                <b style={{textDecoration: "underline"}}>Price</b>
              </Typography>
            </div>
            <div style={{width: "12%"}}>
              <Typography align="right">
                <b style={{textDecoration: "underline"}}>Cost</b>
              </Typography>
            </div>
            <div style={{width: "12%"}}>
              <Typography align="right">
                <b style={{textDecoration: "underline"}}>Status</b>
              </Typography>
            </div>
            <div style={{width: "7%"}}>
              <Typography align="right">
                <b style={{textDecoration: "underline"}}>Days</b>
              </Typography>
            </div>
          </div>

          {/* Car List */}
          {filteredCars.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No vehicles found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || selectedLocation || selectedStatus || daysFilter
                  ? 'Try adjusting your search criteria or filters'
                  : 'No vehicles in inventory with the specified statuses'
                }
              </Typography>
            </Paper>
          ) : (
            filteredCars.map(car => (
              <CarLine key={car.id} car={car} />
            ))
          )}
        </>
      )}
    </Box>
  );
}
