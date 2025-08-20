import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  InputAdornment,
  Fab,
  useTheme,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

const ShippingDashboardPage = () => {
  StateManager.setTitle("Shipping Dashboard");
  const theme = useTheme();
  const history = useHistory();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLoads: 0,
    activeLoads: 0,
    completedLoads: 0,
    totalCars: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [startDate, setStartDate] = useState(() => {
    const now = moment();
    return moment(now).subtract(3, 'month').startOf('month');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = moment();
    return moment(now).endOf('month');
  });
  const [dateType, setDateType] = useState('created_at'); // 'created_at', 'completed_at', or 'departure_date'
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const fetchLoads = async (isInitial = false) => {
    try {
      let query = firebase.firestore()
        .collection('shipping-loads')
        .orderBy("id", 'desc');

      // Apply date filters if they exist
      if (startDate) {
        query = query.where(dateType, '>=', startDate.startOf('day').toISOString());
      }
      if (endDate) {
        query = query.where(dateType, '<=', endDate.endOf('day').toISOString());
      }

      // Only apply limit if no date filters are active
      if (!startDate && !endDate) {
        query = query.limit(30);
      }

      if (!isInitial && lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      // Get all loads first
      const loadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch all purchases for these loads in parallel
      const purchasesPromises = loadsData.map(async (load) => {
        const purchasesSnapshot = await firebase.firestore()
          .collection('purchases')
          .where('stock', '==', load.id)
          .get();

        const additionalCost = purchasesSnapshot.docs.reduce((total, doc) => {
          const purchase = doc.data();
          return total + (purchase.amount || 0);
        }, 0);

        return {
          ...load,
          additional_cost: additionalCost
        };
      });

      const newLoads = await Promise.all(purchasesPromises);

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setLoads(prev => isInitial ? newLoads : [...prev, ...newLoads]);
    } catch (error) {
      console.error('Error fetching loads:', error);
      StateManager.setAlertAndOpen("Error fetching loads", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateLoadRevenue = (load) => {
    if (!load.cars || !Array.isArray(load.cars)) return 0;
    return load.cars.reduce((total, car) => {
      return total + (car.charge || 0);
    }, 0);
  };

  const calculateLoadCost = (load) => {
    const costPerMile = load.cost_per_mile || 0;
    const totalMiles = load.total_miles || 0;
    const additionalCost = load.additional_cost || 0;
    return totalMiles * costPerMile + additionalCost;
  };

  const calculateLoadProfit = (load) => {
    const revenue = calculateLoadRevenue(load);
    const cost = calculateLoadCost(load);
    return revenue - cost;
  };

  const extractDestinationStates = (load) => {
    if (!load.cars || !Array.isArray(load.cars)) return [];
    
    // List of valid US state abbreviations
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    
    const states = new Set();
    load.cars.forEach(car => {
      if (car.address) {
        // Extract state from address using regex to find 2-letter uppercase codes
        const stateRegex = /\b([A-Z]{2})\b/g;
        const matches = car.address.match(stateRegex);
        
        if (matches) {
          matches.forEach(match => {
            // Only add if it's a valid US state
            if (validStates.includes(match)) {
              states.add(match);
            }
          });
        }
      }
    });
    
    return Array.from(states).sort();
  };

  const fetchMetrics = async () => {
    try {
      let query = firebase.firestore()
        .collection('shipping-loads');

      // Apply date filters if they exist
      if (startDate) {
        query = query.where(dateType, '>=', startDate.startOf('day').toISOString());
      }
      if (endDate) {
        query = query.where(dateType, '<=', endDate.endOf('day').toISOString());
      }

      const snapshot = await query.get();

      const loadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch all purchases for these loads in parallel
      const loadsWithPurchases = await Promise.all(loadsData.map(async (load) => {
        const purchasesSnapshot = await firebase.firestore()
          .collection('purchases')
          .where('stock', '==', load.id)
          .get();

        const additionalCost = purchasesSnapshot.docs.reduce((total, doc) => {
          const purchase = doc.data();
          return total + (purchase.amount || 0);
        }, 0);

        return {
          ...load,
          additional_cost: additionalCost
        };
      }));
      
      const totalRevenue = loadsWithPurchases.reduce((acc, load) => acc + calculateLoadRevenue(load), 0);
      const totalProfit = loadsWithPurchases.reduce((acc, load) => acc + calculateLoadProfit(load), 0);
      
      setMetrics({
        totalLoads: loadsWithPurchases.length,
        activeLoads: loadsWithPurchases.filter(load => load.status === 'in_progress').length,
        completedLoads: loadsWithPurchases.filter(load => load.status === 'completed').length,
        totalCars: loadsWithPurchases.reduce((acc, load) => acc + (load.cars?.length || 0), 0),
        totalRevenue,
        totalProfit
      });

      // Extract unique drivers for the filter
      const drivers = [...new Set(loadsWithPurchases
        .map(load => load.driver)
        .filter(driver => driver && driver.trim())
        .sort()
      )];
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    setLoads([]);
    setLastDoc(null);
    setHasMore(true);
    fetchLoads(true);
    fetchMetrics();
  }, [startDate, endDate, dateType]);

  // Reset driver filter when date filters change
  useEffect(() => {
    setDriverFilter('');
  }, [startDate, endDate, dateType]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      fetchLoads();
    }
  };

  const filteredLoads = loads.filter(load => {
    // Apply driver filter first
    if (driverFilter.trim() && (!load.driver || !load.driver.toLowerCase().includes(driverFilter.toLowerCase()))) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Search in load basic info (excluding driver since it's handled by driverFilter)
    const loadMatches = 
      load.id.toLowerCase().includes(searchLower) ||
      (load.start && load.start.toLowerCase().includes(searchLower)) ||
      (load.end && load.end.toLowerCase().includes(searchLower)) ||
      (load.status && load.status.toLowerCase().includes(searchLower)) ||
      (load.deposit_complete ? 'funded' : 'unfunded').includes(searchLower);
    
    if (loadMatches) return true;
    
    // Search in cars array
    if (load.cars && Array.isArray(load.cars)) {
      const carMatches = load.cars.some(car => {
        if (!car) return false;
        
        return (
          // Car basic info
          (car.carTitle && car.carTitle.toLowerCase().includes(searchLower)) ||
          (car.id && car.id.toLowerCase().includes(searchLower)) ||
          
          // Car addresses
          (car.address && car.address.toLowerCase().includes(searchLower)) ||
          
          // Car customer info
          (car.customerName && car.customerName.toLowerCase().includes(searchLower)) ||
          (car.email && car.email.toLowerCase().includes(searchLower)) ||
          (car.phone_number && car.phone_number.toLowerCase().includes(searchLower))
        );
      });
      
      if (carMatches) return true;
      
      // Search in destination states
      const destinationStates = extractDestinationStates(load);
      const stateMatches = destinationStates.some(state => 
        state.toLowerCase().includes(searchLower)
      );
      
      if (stateMatches) return true;
    }
    
    return false;
  });

  const handleLoadClick = (loadId, event) => {
    // Check if Ctrl or Cmd key is pressed
    if (event.ctrlKey || event.metaKey) {
      // Open in new tab
      window.open(`/load/${loadId}`, '_blank');
    } else {
      // Navigate in same tab
      history.push(`/load/${loadId}`);
    }
  };

  const handleCreateLoad = async () => {
    try {
      // Get the last load to determine the new ID
      const lastLoadSnapshot = await firebase.firestore()
        .collection('shipping-loads')
        .orderBy('id', 'desc')
        .limit(1)
        .get();

      let newLoadId = '1';
      if (!lastLoadSnapshot.empty) {
        const lastLoad = lastLoadSnapshot.docs[0];
        newLoadId = (parseInt(lastLoad.id) + 1).toString();
      }

      const newLoadData = {
        id: newLoadId,
        cars: [],
        start: "10420 Portal Crossing, Sarasota, FL 34211",
        end: "10420 Portal Crossing, Sarasota, FL 34211",
        status: "pending",
        created_at: moment().toISOString(),
        completed_at: null,
        total_miles: 0,
      };

      // Create the new load document
      const loadRef = firebase.firestore().collection('shipping-loads').doc(newLoadId);
      await loadRef.set(newLoadData);

      // Update local state
      setLoads(prev => [newLoadData, ...prev]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalLoads: prev.totalLoads + 1,
        activeLoads: prev.activeLoads + 1
      }));

      // Navigate to the new load
      history.push(`/load/${newLoadId}`);
    } catch (error) {
      console.error('Error creating new load:', error);
      StateManager.setAlertAndOpen("Error creating new load", "error");
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color }) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box 
          sx={{ 
            p: 1, 
            borderRadius: 2,
            backgroundColor: alpha(color, 0.1),
            mr: 2
          }}
        >
          <Icon sx={{ color: color, fontSize: 24 }} />
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 600, color: color }}>
        {value}
      </Typography>
    </Paper>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[600];
    }
  };

  return (
    <Container maxWidth={false} sx={{ minHeight: '100vh', py: 3, position: 'relative', pb: 12 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Shipping Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage your shipping operations
        </Typography>
      </Box>

      {/* Operational Metrics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Total Loads" 
            value={metrics.totalLoads} 
            icon={TimelineIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Active Loads" 
            value={metrics.activeLoads} 
            icon={LocalShippingIcon}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Completed Loads" 
            value={metrics.completedLoads} 
            icon={CheckCircleIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Total Cars" 
            value={metrics.totalCars} 
            icon={DirectionsCarIcon}
            color={theme.palette.secondary.main}
          />
        </Grid>
      </Grid>

      {/* Financial Metrics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <MetricCard 
            title="Total Revenue" 
            value={`$${metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            icon={AttachMoneyIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MetricCard 
            title="Total Profit" 
            value={`$${metrics.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            icon={TrendingUpIcon}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Search and Filter Section */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3, 
          p: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2
        }}>
          <TextField
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              },
            }}
            variant="outlined"
            placeholder="Search loads, cars, addresses, VINs, or any details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Driver</InputLabel>
            <Select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              label="Driver"
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              }}
            >
              <MenuItem value="">
                <em>All Drivers</em>
              </MenuItem>
              {availableDrivers.map((driver) => (
                <MenuItem key={driver} value={driver}>
                  {driver}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Filter by date">
            <IconButton
              onClick={() => setIsFilterDialogOpen(true)}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
                width: 48,
                height: 48,
              }}
            >
              <CalendarMonthIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Date Filter Dialog */}
      <Dialog 
        open={isFilterDialogOpen} 
        onClose={() => setIsFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter by Date
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <ToggleButtonGroup
              value={dateType}
              exclusive
              onChange={(e, newValue) => newValue && setDateType(newValue)}
              aria-label="date filter type"
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '8px !important',
                  px: 3,
                  py: 1,
                  typography: 'body2',
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                },
              }}
            >
              <ToggleButton value="created_at">
                Creation Date
              </ToggleButton>
              <ToggleButton value="departure_date">
                Departure Date
              </ToggleButton>
              <ToggleButton value="completed_at">
                Completion Date
              </ToggleButton>
            </ToggleButtonGroup>

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const today = moment();
                      setStartDate(today.startOf('day'));
                      setEndDate(today.endOf('day'));
                    }}
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 2,
                      minWidth: 'auto'
                    }}
                  >
                    Today
                  </Button>
                </Box>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      fullWidth: true,
                      size: "small",
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      fullWidth: true,
                      size: "small",
                    }
                  }}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setDateType('created_at');
              setDriverFilter('');
            }}
            color="inherit"
          >
            Clear
          </Button>
          <Button 
            onClick={() => setIsFilterDialogOpen(false)}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loads Table */}
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          mb: 4,
          '& .MuiTableHead-root': {
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
        onScroll={handleScroll}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Load ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Cars</TableCell>
              <TableCell>Destination States</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Profit</TableCell>
              <TableCell>Departure Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLoads.map((load) => {
              const revenue = calculateLoadRevenue(load);
              const profit = calculateLoadProfit(load);
              
              return (
                <TableRow
                  key={load.id}
                  onClick={(event) => handleLoadClick(load.id, event)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(load.status),
                          mr: 1.5,
                        }}
                      />
                      <Typography sx={{ fontWeight: 500 }}>
                        {load.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        backgroundColor: alpha(getStatusColor(load.status), 0.1),
                        color: getStatusColor(load.status),
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {load.status || 'pending'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        backgroundColor: load.deposit_complete 
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.error.main, 0.1),
                        color: load.deposit_complete 
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {load.deposit_complete ? 'Funded' : 'Unfunded'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: theme.palette.text.secondary }}>
                        {load.driver || 'N/A'}
                      </Typography>
                      {load.driver_paid && (
                        <Tooltip title="Driver Paid">
                          <CheckCircleIcon 
                            sx={{ 
                              fontSize: 18, 
                              color: theme.palette.success.main 
                            }} 
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(!load.cars || load.cars.length === 0) ? (
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontStyle: 'italic'
                          }}
                        >
                          No cars in this load
                        </Typography>
                      ) : (
                        <>
                          {load.cars.slice(0, 2).map((car, index) => (
                            <Typography 
                              key={index}
                              variant="body2"
                              sx={{ 
                                color: theme.palette.text.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <DirectionsCarIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                              {car.carTitle || `${car.year} ${car.make} ${car.model}`}
                            </Typography>
                          ))}
                          {load.cars.length > 2 && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.primary.main,
                                fontWeight: 500,
                                mt: 0.5
                              }}
                            >
                              +{load.cars.length - 2} more cars
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(() => {
                        const states = extractDestinationStates(load);
                        if (states.length === 0) {
                          return (
                            <Typography 
                              variant="body2"
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontStyle: 'italic'
                              }}
                            >
                              No destinations
                            </Typography>
                          );
                        }
                        return (
                          <>
                            {states.slice(0, 3).map((state, index) => (
                              <Typography 
                                key={index}
                                variant="body2"
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.secondary.main,
                                    mr: 1
                                  }}
                                />
                                {state}
                              </Typography>
                            ))}
                            {states.length > 3 && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  fontWeight: 500,
                                  mt: 0.5
                                }}
                              >
                                +{states.length - 3} more states
                              </Typography>
                            )}
                          </>
                        );
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      {revenue > 0 ? `$${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ 
                      color: profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 500
                    }}>
                      {`$${profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      {load.departure_date ? new Date(load.departure_date).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            {loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Load Button */}
      <Fab
        color="primary"
        aria-label="add load"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        }}
        onClick={handleCreateLoad}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default ShippingDashboardPage; 