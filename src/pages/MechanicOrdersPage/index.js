import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  useTheme,
  alpha,
  Alert,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  FormControl,
  Select,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment';
import constants from '../../utilities/constants';
import Blade from '../../components/Blade';
import ServicesBlade from './ServicesBlade';
import PartsBlade from './PartsBlade';

const MechanicReadyOrdersPage = () => {
  StateManager.setTitle(`${StateManager.mechanicName}'s Service Orders`);
  const theme = useTheme();
  const history = useHistory();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('working');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bladeOpen, setBladeOpen] = useState(false);
  const [partsBladeOpen, setPartsBladeOpen] = useState(false);
  const [selectedOrderForParts, setSelectedOrderForParts] = useState(null);
  const [metrics, setMetrics] = useState({
    estimate: 0,
    parts: 0,
    ready: 0,
    working: 0,
    currentPeriodHours: 0
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedOrderForMenu, setSelectedOrderForMenu] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState(StateManager.mechanicId);
  
  // Date range state for current period hours
  const [dateRangeDialogOpen, setDateRangeDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(moment().startOf('week'));
  const [endDate, setEndDate] = useState(moment().endOf('week'));

  useEffect(() => {
    fetchOrders();
    fetchCurrentPeriodHours();
  }, [selectedMechanic, startDate, endDate]);

  const fetchCurrentPeriodHours = async () => {
    try {
      if (!selectedMechanic) {
        setMetrics(prev => ({ ...prev, currentPeriodHours: 0 }));
        return;
      }

      const startDateStr = startDate.format('YYYY/MM/DD');
      const endDateStr = endDate.format('YYYY/MM/DD');

      const query = firebase.firestore()
        .collection('services')
        .where('mechanicID', '==', selectedMechanic)
        .where('status', '==', 'complete')
        .where('status_time', '>=', startDateStr)
        .where('status_time', '<=', endDateStr);

      const snapshot = await query.get();
      
      const totalHours = snapshot.docs.reduce((sum, doc) => {
        const service = doc.data();
        return sum + (parseFloat(service.time) || 0);
      }, 0);

      setMetrics(prev => ({ 
        ...prev, 
        currentPeriodHours: Math.round(totalHours * 10) / 10 
      }));
    } catch (error) {
      console.error('Error fetching current period hours:', error);
      setMetrics(prev => ({ ...prev, currentPeriodHours: 0 }));
    }
  };

  const handleMechanicChange = (event) => {
    const mechanicId = event.target.value;
    const mechanic = constants.mechanics.find(m => m.id === mechanicId);
    if (mechanic) {
      setSelectedMechanic(mechanicId);
      StateManager.setMechanicState(mechanicId, mechanic.name);
      StateManager.setTitle(`${mechanic.name}'s Service Orders`);
    }
  };

  const handleDateRangeClick = () => {
    setDateRangeDialogOpen(true);
  };

  const handleDateRangeClose = () => {
    setDateRangeDialogOpen(false);
  };

  const handleDateRangeSave = () => {
    setDateRangeDialogOpen(false);
  };

  const handleResetToToday = () => {
    setStartDate(moment());
    setEndDate(moment());
    setDateRangeDialogOpen(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!selectedMechanic) {
        setLoading(false);
        setMetrics(prev => ({
          estimate: 0,
          parts: 0,
          ready: 0,
          working: 0,
          currentPeriodHours: prev.currentPeriodHours
        }));
        return;
      }

      const query = firebase.firestore()
        .collection('orders')
        .where('mechanicId', '==', selectedMechanic)
        .where('status', 'in', ['estimate', 'parts', 'ready', 'working']);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        setOrders([]);
        setMetrics(prev => ({
          estimate: 0,
          parts: 0,
          ready: 0,
          working: 0,
          currentPeriodHours: prev.currentPeriodHours
        }));
        setLoading(false);
        return;
      }

      const ordersData = await Promise.all(snapshot.docs.map(async (doc) => {
        const order = { id: doc.id, ...doc.data() };
        
        // Fetch car data
        let carData = null;
        if (order.car) {
          const carSnapshot = await firebase.firestore()
            .doc(`cars/${order.car}`)
            .get();

          if (!carSnapshot.empty) {
            const car = carSnapshot.data();
            carData = {
              car_title: `${car.stock} - ${car.year} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ''}`,
              car_thumbnail: car.thumbnail,
              score: car.score || 0
            };
          }
        }

        // Fetch customer data
        let customerData = null;
        if (order.customer) {
          const customerSnapshot = await firebase.firestore()
            .doc(`customers/${order.customer}`)
            .get();

          if (!customerSnapshot.empty) {
            const customer = customerSnapshot.data();
            customerData = {
              customer_name: `${customer.first_name} ${customer.last_name}`
            };
          }
        }

        // Fetch services for this order
        const servicesSnapshot = await firebase.firestore()
          .collection('services')
          .where('order', '==', order.id)
          .get();

        const services = servicesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        // Calculate service hours
        const totalHours = services.reduce((sum, service) => sum + (parseFloat(service.time) || 0), 0);
        const completedHours = services.reduce((sum, service) => 
          sum + (service.status === 'complete' ? (parseFloat(service.time) || 0) : 0), 0);
        const remainingHours = Math.max(0, totalHours - completedHours);

        return {
          ...order,
          ...(carData || {}),
          ...(customerData || {}),
          services,
          totalHours: Math.round(totalHours * 10) / 10,
          completedHours: Math.round(completedHours * 10) / 10,
          remainingHours: Math.round(remainingHours * 10) / 10
        };
      }));

      // Sort orders by score (highest to lowest) and assign priority
      ordersData.sort((a, b) => (b.score || 0) - (a.score || 0));
      ordersData.forEach((order, index) => {
        order.priority = index + 1;
      });

      // Calculate metrics
      const newMetrics = {
        estimate: ordersData.filter(o => o.status === 'estimate').length,
        parts: ordersData.filter(o => o.status === 'parts').length,
        ready: ordersData.filter(o => o.status === 'ready').length,
        working: ordersData.filter(o => o.status === 'working').length,
        currentPeriodHours: 0
      };

      setOrders(ordersData);
      setMetrics(prev => ({
        ...newMetrics,
        currentPeriodHours: prev.currentPeriodHours
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setBladeOpen(true);
  };

  const handleBladeClose = () => {
    setBladeOpen(false);
    setSelectedOrder(null);
  };

  const handlePartsBladeClose = () => {
    setPartsBladeOpen(false);
    setSelectedOrderForParts(null);
  };

  const handleServiceUpdate = (updatedServices) => {
    // Update local state
    const updatedOrders = orders.map(order => {
      if (order.id === selectedOrder.id) {
        return { ...order, services: updatedServices };
      }
      return order;
    });
    setOrders(updatedOrders);
    setSelectedOrder(prev => ({
      ...prev,
      services: updatedServices
    }));
  };

  const getStatusColor = (status) => {
    const statusIndex = constants.order_statuses.indexOf(status);
    if (statusIndex === -1) return theme.palette.grey[500];

    // Create a progression from blue (start) to green (complete)
    const totalStatuses = constants.order_statuses.length;
    const progress = statusIndex / (totalStatuses - 1);

    // Use a color palette that progresses from blue to green, avoiding yellow/orange
    if (progress < 0.25) {
      return theme.palette.info.light; // Early stages - light blue
    } else if (progress < 0.5) {
      return theme.palette.info.main; // Planning stages - blue
    } else if (progress < 0.75) {
      return theme.palette.primary.main; // Middle stages - primary color
    } else {
      return theme.palette.success.main; // Final stages - green
    }
  };

  const MetricCard = ({ status, count, color }) => {
    const isActive = activeStatus === status;
    
    // Calculate hours for this status
    const statusOrders = orders.filter(order => order.status === status);
    const totalHours = statusOrders.reduce((sum, order) => sum + (order.totalHours || 0), 0);
    const remainingHours = statusOrders.reduce((sum, order) => sum + (order.remainingHours || 0), 0);
    
    return (
      <Card 
        onClick={() => setActiveStatus(isActive ? null : status)}
        sx={{ 
          bgcolor: isActive ? alpha(color, 0.2) : alpha(color, 0.1),
          height: '100%',
          border: `2px solid ${isActive ? color : alpha(color, 0.2)}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: alpha(color, 0.15),
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center">
              {status === 'estimate' && <AssessmentIcon sx={{ mr: 1, color: color, fontSize: 20 }} />}
              {status === 'parts' && <InventoryIcon sx={{ mr: 1, color: color, fontSize: 20 }} />}
              {status === 'ready' && <CheckCircleIcon sx={{ mr: 1, color: color, fontSize: 20 }} />}
              {status === 'working' && <BuildIcon sx={{ mr: 1, color: color, fontSize: 20 }} />}
              <Typography variant="subtitle1" sx={{ color: isActive ? color : 'inherit' }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ color: color, fontWeight: 'bold' }}>
              {count}
            </Typography>
          </Box>
          
          {/* Hours Information */}
          <Box sx={{ mt: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Total Hours:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: color }}>
                {totalHours.toFixed(1)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Remaining:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: color }}>
                {remainingHours.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const handleMenuClick = (event, order) => {
    console.log('handleMenuClick', event.currentTarget, order);
    event.stopPropagation(); // Prevent row click
    setMenuAnchorEl(event.currentTarget);
    setSelectedOrderForMenu(order);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation(); // Prevent row click
    setMenuAnchorEl(null);
    setSelectedOrderForMenu(null);
  };

  const handleViewServices = (event) => {
    event.stopPropagation();
    handleMenuClose();
    setSelectedOrder(selectedOrderForMenu);
    setBladeOpen(true);
  };

  const handleViewParts = (event) => {
    event.stopPropagation();
    handleMenuClose();
    setSelectedOrderForParts(selectedOrderForMenu);
    setPartsBladeOpen(true);
  };

  if (!StateManager.mechanicId) {
    return (
      <Container maxWidth="md" style={{ marginTop: '2rem' }}>
        <Paper style={{ padding: '2rem', textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            No mechanic ID found. Please log in as a mechanic to view your orders.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      {/* Mechanic Selector for Admin */}
      {StateManager.isAdmin() && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderRadius: 1
          }}
        >
          <FormControl fullWidth>
            <InputLabel>Select Mechanic</InputLabel>
            <Select
              value={selectedMechanic}
              onChange={handleMechanicChange}
              label="Select Mechanic"
            >
              {constants.mechanics
                .filter(mech => mech.name !== "Placeholder")
                .map((mech) => (
                  <MenuItem key={mech.id} value={mech.id}>
                    {mech.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Hours Indicator with Mechanic Name */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1
                }}>
                  <BuildIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                    {StateManager.mechanicName}'s Dashboard
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1.5
                }}>
                  <TimelineIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Period Hours
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleDateRangeClick}
                        sx={{ 
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        <CalendarTodayIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {metrics.currentPeriodHours.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {startDate.isSame(endDate, 'day') 
                        ? startDate.format('MMM D, YYYY')
                        : `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1.5
                }}>
                  <InventoryIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Active Orders
                    </Typography>
                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {metrics.estimate + metrics.working + metrics.ready + metrics.parts}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                status="estimate" 
                count={metrics.estimate} 
                color={getStatusColor('estimate')} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                status="parts" 
                count={metrics.parts} 
                color={getStatusColor('parts')} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                status="ready" 
                count={metrics.ready} 
                color={getStatusColor('ready')} 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                status="working" 
                count={metrics.working} 
                color={getStatusColor('working')} 
              />
            </Grid>
          </Grid>

          {/* Orders Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Priority</TableCell>
                  <TableCell>SO #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Car</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders
                  .filter(order => !activeStatus || order.status === activeStatus)
                  .map((order) => (
                  <TableRow 
                    key={order.id}
                    hover
                    onClick={() => handleOrderClick(order)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box 
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(
                            order.priority === 1 ? theme.palette.error.main :
                            order.priority <= 3 ? theme.palette.info.main :
                            theme.palette.grey[500],
                            0.1
                          ),
                          color: 
                            order.priority === 1 ? theme.palette.error.main :
                            order.priority <= 3 ? theme.palette.info.main :
                            theme.palette.grey[500],
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 40,
                          justifyContent: 'center'
                        }}
                      >
                        #{order.priority}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {order.so_number || order.id.slice(-6).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>
                        {order.customer_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {order.car_thumbnail ? (
                          <Box
                            component="img"
                            src={order.car_thumbnail}
                            alt={order.car_title}
                            sx={{
                              width: 60,
                              height: 40,
                              objectFit: 'cover',
                              mr: 2,
                              borderRadius: 1
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 40,
                              mr: 2,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.grey[300], 0.5),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <DirectionsCarIcon 
                              sx={{ 
                                color: theme.palette.grey[500],
                                fontSize: 30
                              }} 
                            />
                          </Box>
                        )}
                        <Typography>{order.car_title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box 
                        display="flex" 
                        alignItems="center"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(getStatusColor(order.status), 0.1),
                          color: getStatusColor(order.status),
                          fontWeight: 'medium',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {order.status === 'estimate' && <AssessmentIcon sx={{ fontSize: 20 }} />}
                        {order.status === 'parts' && <InventoryIcon sx={{ fontSize: 20 }} />}
                        {order.status === 'ready' && <CheckCircleIcon sx={{ fontSize: 20 }} />}
                        {order.status === 'working' && <BuildIcon sx={{ fontSize: 20 }} />}
                        <Typography>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <TimelineIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                        <Typography>
                          {order.completedHours}/{order.totalHours} ({order.remainingHours} remaining)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, order)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.filter(order => !activeStatus || order.status === activeStatus).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <WarningIcon sx={{ fontSize: 48, color: theme.palette.warning.main }} />
                        <Typography variant="h6" color="text.secondary">
                          {activeStatus ? `No ${activeStatus} orders found` : 'No orders found'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activeStatus === 'parts' ? 
                            "No orders waiting for parts - contact service manager or Max if you need parts ordered" :
                            activeStatus === 'ready' ?
                            "No ready orders - contact service manager or Max if you need work assigned" :
                            activeStatus === 'working' ?
                            "No working orders - contact service manager or Max if you need work assigned" :
                            "Contact the service manager or Max if you need work assigned"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleViewServices}>View services</MenuItem>
            <MenuItem onClick={handleViewParts}>View parts</MenuItem>
          </Menu>

          <Blade
            open={bladeOpen}
            onClose={handleBladeClose}
            title={`Services for ${selectedOrder?.car_title || ''}`}
          >
            {selectedOrder && (
              <ServicesBlade
                order={selectedOrder}
                onClose={handleBladeClose}
                onUpdate={handleServiceUpdate}
              />
            )}
          </Blade>

          <Blade
            open={partsBladeOpen}
            onClose={handlePartsBladeClose}
            title={`Parts for ${selectedOrderForParts?.car_title || ''}`}
          >
            {selectedOrderForParts && (
              <PartsBlade
                order={selectedOrderForParts}
                onClose={handlePartsBladeClose}
                onUpdate={() => {}}
              />
            )}
          </Blade>
        </>
      )}

      {/* Date Range Dialog */}
      <Dialog 
        open={dateRangeDialogOpen} 
        onClose={handleDateRangeClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6">
              Set Date Range for Current Period Hours
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newDate) => setStartDate(newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newDate) => setEndDate(newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This will show completed service hours for {selectedMechanic ? constants.mechanics.find(m => m.id === selectedMechanic)?.name : 'the selected mechanic'} 
              between the selected dates.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetToToday} color="secondary">
            Reset to Today
          </Button>
          <Button onClick={handleDateRangeClose} color="inherit">
            Close
          </Button>
          {/* <Button onClick={handleDateRangeSave} variant="contained">
            Apply
          </Button> */}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MechanicReadyOrdersPage; 