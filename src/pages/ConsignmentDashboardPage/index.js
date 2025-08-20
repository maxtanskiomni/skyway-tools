import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  LinearProgress,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import DateRangeSelector from '../../components/DateRangeSelector';
import PerformanceChart from './PerformanceChart';
import MetricCard from './MetricCard';
import VehicleCard from './VehicleCard';
import ConsignorLeaderboard from './ConsignorLeaderboard';

const ConsignmentDashboardPage = () => {
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [metrics, setMetrics] = useState({
    totalConsigned: 0,
    totalSold: 0,
    listingValue: 0
  });
  const [performanceData, setPerformanceData] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsignor, setSelectedConsignor] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(() => {
    // Default to all statuses except 'terminated'
    return constants.statuses.filter(status => !['terminated', 'holding', 'admin review', 'service'].includes(status));
  });
  const [startDate, setStartDate] = useState(() => {
    const now = moment();
    return moment(now).subtract(0, 'months').startOf('month').toDate();
  });
  const [endDate, setEndDate] = useState(() => {
    const now = moment();
    return moment(now).endOf('month').toDate();
  });
  
  // Multi-select popover state
  const [typeAnchorEl, setTypeAnchorEl] = useState(null);
  
  // Collapsible sections state
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);
  const [performanceExpanded, setPerformanceExpanded] = useState(false);
  
  StateManager.setTitle("Consignment Dashboard");
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = firebase.firestore();
        
        // Format dates for Firebase query
        const startDateStr = moment(startDate).format('YYYY/MM/DD');
        const endDateStr = moment(endDate).format('YYYY/MM/DD');
        
        // Fetch cars with consign_rep within date range
        const carsSnapshot = await db.collection('cars')
          .where('consign_rep', '!=', null)
          .where('date', '>=', startDateStr)
          .where('date', '<=', endDateStr)
          .get();
        
        const carsData = carsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => b.id.replace(/\D/g, "") - a.id.replace(/\D/g, ""));
        
        // Fetch consignor names
        const consignorIds = [...new Set(carsData.map(car => car.consignor).filter(Boolean))];
        const consignorPromises = consignorIds.map(id => 
          db.collection('customers').doc(id).get()
        );
        const consignorSnapshots = await Promise.all(consignorPromises);
        
        const consignorMap = {};
        consignorSnapshots.forEach((snap, index) => {
          if (snap.exists) {
            const data = snap.data();
            consignorMap[consignorIds[index]] = `${data.first_name || ''} ${data.last_name || ''}`.trim();
          }
        });
        
        // Fetch lead counts
        const leadPromises = carsData.map(car => 
          db.collection('leads').where('stock', '==', car.id).get()
        );
        const leadSnapshots = await Promise.all(leadPromises);
        
        // Fetch deal data for sold vehicles
        const dealPromises = carsData.map(car => 
          db.collection('deals').doc(car.id).get()
        );
        const dealSnapshots = await Promise.all(dealPromises);
        
        // Process vehicles data
        const processedVehicles = carsData.map((car, index) => {
          const leadCount = leadSnapshots[index].docs.length;
          const dealData = dealSnapshots[index].exists ? dealSnapshots[index].data() : null;
          
          return {
            ...car,
            consignor_name: consignorMap[car.consignor] || 'Unknown',
            lead_count: leadCount,
            deal_date: dealData?.date || null,
            carTitle: `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim()
          };
        });
        
        setVehicles(processedVehicles);
        
      } catch (error) {
        console.error('Error fetching consignment data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [startDate, endDate]);
  
  // Apply filters and update metrics
  useEffect(() => {
    let filtered = vehicles;
    
    // Date filter - use car's date for filtering
    filtered = filtered.filter(vehicle => {
      if (!vehicle.date) return false;
      return moment(vehicle.date, 'YYYY/MM/DD').isBetween(moment(startDate), moment(endDate), 'day', '[]');
    });
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.carTitle.toLowerCase().includes(query) ||
        vehicle.stock.toLowerCase().includes(query) ||
        vehicle.consignor_name.toLowerCase().includes(query)
      );
    }
    
    // Consignor filter
    if (selectedConsignor) {
      filtered = filtered.filter(vehicle => vehicle.consign_rep === selectedConsignor);
    }
    
    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(vehicle => vehicle.location === selectedLocation);
    }
    
    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(vehicle => selectedTypes.includes(vehicle.status));
    }
    
    setFilteredVehicles(filtered);
    
    // Update metrics based on filtered data
    const totalConsigned = filtered.length;
    const totalSold = filtered.filter(v => v.status === 'sold').length;
    const listingValue = filtered
      .reduce((sum, v) => sum + (v.price || 0), 0);
    
    setMetrics({
      totalConsigned,
      totalSold,
      listingValue
    });
    
    // Update performance data based on filtered vehicles
    const performance = [];
    filtered.forEach(vehicle => {
      // Use car's date for consigned vehicles (cars coming in)
      if (vehicle.date) {
        performance.push({
          date: vehicle.date,
          type: 'consigned'
        });
      }
      // Use deal date for sold vehicles (cars going out)
      if (vehicle.status === 'sold' && vehicle.deal_date) {
        performance.push({
          date: vehicle.deal_date,
          type: 'sold'
        });
      }
    });
    setPerformanceData(performance);
    
  }, [vehicles, searchQuery, selectedConsignor, selectedLocation, selectedTypes, startDate, endDate]);
  
  // Handle vehicle card click
  const handleVehicleClick = (vehicle) => {
    history.push(`/car/${vehicle.id}`);
  };
  
  // Handle date range change
  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };
  
  // Multi-select handlers
  const handleTypeClick = (event) => {
    setTypeAnchorEl(event.currentTarget);
  };

  const handleTypeClose = () => {
    setTypeAnchorEl(null);
  };

  const handleTypeToggle = (status) => {
    setSelectedTypes(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSelectAllTypes = () => {
    setSelectedTypes(constants.statuses.filter(status => status !== 'terminated'));
  };

  const handleClearAllTypes = () => {
    setSelectedTypes([]);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedConsignor('');
    setSelectedLocation('');
    setSelectedTypes(constants.statuses.filter(status => status !== 'terminated'));
  };

  // Loading skeleton components
  const MetricCardSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={120} height={24} />
        </Box>
        <Skeleton variant="text" width={60} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={140} height={20} />
      </CardContent>
    </Card>
  );

  const PerformanceChartSkeleton = () => (
    <Paper sx={{ p: 3, height: 400 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={300} />
    </Paper>
  );

  const VehicleCardSkeleton = () => (
    <Card sx={{ height: 280 }}>
      <Skeleton variant="rectangular" width="100%" height={140} />
      <CardContent>
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={16} />
      </CardContent>
    </Card>
  );
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Consignment Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor consignment performance and manage vehicle listings
        </Typography>
      </Box>
      
      {/* Date Range Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          title="Date Range"
          showQuickSelectors={true}
        />
      </Paper>
      
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          {loading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Total Consigned"
              value={metrics.totalConsigned}
              subtitle={`Vehicles in consignment`}
              icon={CarIcon}
              color={theme.palette.primary.main}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {loading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Vehicles Sold"
              value={metrics.totalSold}
              subtitle={`Successfully sold`}
              icon={TrendingUpIcon}
              color={theme.palette.success.main}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {loading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Listing Value"
              value={`$${metrics.listingValue.toLocaleString()}`}
              subtitle={`Total value of all vehicles`}
              icon={MoneyIcon}
              color={theme.palette.info.main}
            />
          )}
        </Grid>
      </Grid>
      
      {/* Consignor Leaderboard */}
      <Paper sx={{ mb: 3 }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
          onClick={() => setLeaderboardExpanded(!leaderboardExpanded)}
        >
          <Typography variant="h6" component="h2">
            Consignor Leaderboard
          </Typography>
          {leaderboardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        {leaderboardExpanded && (
          <Box sx={{ p: 2, pt: 0 }}>
            <ConsignorLeaderboard 
              vehicles={filteredVehicles}
              loading={loading}
            />
          </Box>
        )}
      </Paper>
      
      {/* Performance Chart */}
      <Paper sx={{ mb: 4 }}>
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
          onClick={() => setPerformanceExpanded(!performanceExpanded)}
        >
          <Typography variant="h6" component="h2">
            Performance Over Time
          </Typography>
          {performanceExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        {performanceExpanded && (
          <Box sx={{ p: 2, pt: 0 }}>
            {loading ? (
              <PerformanceChartSkeleton />
            ) : (
              <PerformanceChart 
                data={performanceData}
                startDate={startDate}
                endDate={endDate}
              />
            )}
          </Box>
        )}
      </Paper>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Consignor</InputLabel>
            <Select
              value={selectedConsignor}
              label="Consignor"
              onChange={(e) => setSelectedConsignor(e.target.value)}
            >
              <MenuItem value="">All Consignors</MenuItem>
              {constants.consignors.map((consignor) => (
                <MenuItem key={consignor} value={consignor}>
                  {consignor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={selectedLocation}
              label="Location"
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <MenuItem value="">All Locations</MenuItem>
              {constants.locations.map((location) => (
                <MenuItem key={location.value} value={location.value}>
                  {location.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <Button
              variant="outlined"
              onClick={handleTypeClick}
              sx={{ 
                justifyContent: 'space-between',
                textTransform: 'none',
                minHeight: 56
              }}
            >
              <Typography variant="body2">
                {selectedTypes.length === 0 
                  ? 'No Types Selected' 
                  : selectedTypes.length === constants.statuses.filter(s => s !== 'terminated').length
                  ? 'All Types'
                  : `${selectedTypes.length} Type${selectedTypes.length !== 1 ? 's' : ''} Selected`
                }
              </Typography>
            </Button>
            <Popover
              open={Boolean(typeAnchorEl)}
              anchorEl={typeAnchorEl}
              onClose={handleTypeClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: { minWidth: 250, maxHeight: 400 }
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Select Types</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={handleSelectAllTypes}>All</Button>
                    <Button size="small" onClick={handleClearAllTypes}>None</Button>
                  </Box>
                </Box>
              </Box>
              <List sx={{ p: 0 }}>
                {constants.statuses.filter(status => !['holding', 'admin review', 'service'].includes(status)).map((status) => (
                  <ListItem key={status} dense>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedTypes.includes(status)}
                        onChange={() => handleTypeToggle(status)}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={status.charAt(0).toUpperCase() + status.slice(1)} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Popover>
          </FormControl>
          
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} color="primary">
              <ClearIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? (
                <Skeleton variant="text" width={100} />
              ) : (
                `${filteredVehicles.length} vehicles found`
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Vehicles Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <VehicleCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : filteredVehicles.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No vehicles found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your filters or date range
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredVehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
              <VehicleCard 
                vehicle={vehicle}
                onCardClick={handleVehicleClick}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ConsignmentDashboardPage;
