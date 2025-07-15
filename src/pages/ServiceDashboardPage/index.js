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
  InputLabel,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InventoryIcon from '@mui/icons-material/Inventory';
import PrintIcon from '@mui/icons-material/Print';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import constants from '../../utilities/constants';
import ServicesBlade from '../MechanicOrdersPage/ServicesBlade';
import PartsBlade from '../MechanicOrdersPage/PartsBlade';

const ServiceDashboardPage = () => {
  // Component setup
  StateManager.setTitle("Service Dashboard");
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();

  // Helper functions
  const getMechanicName = (mechanicId) => {
    const mechanic = constants.mechanics.find(m => m.id === mechanicId);
    return mechanic ? mechanic.name : '-';
  };

  const getMechanicColor = (mechanicId) => {
    if (!mechanicId) return theme.palette.grey[500];
    
    // Create a consistent color mapping based on mechanic ID
    const colors = [
      theme.palette.primary.main,    // Blue
      theme.palette.success.main,    // Green
      theme.palette.info.main,       // Light Blue
      theme.palette.error.main,      // Red
      theme.palette.secondary.main,  // Purple
      theme.palette.warning.dark,    // Orange
      '#2E7D32',                    // Dark Green
      '#1976D2',                    // Dark Blue
      '#7B1FA2',                    // Dark Purple
      '#C2185B',                    // Pink
      '#00796B',                    // Teal
      '#5D4037',                    // Brown
      '#455A64',                    // Blue Grey
      '#D81B60',                    // Deep Pink
      '#00897B',                    // Teal
      '#5E35B1',                    // Deep Purple
    ];

    // Use the mechanic's index in the array to determine color
    const index = constants.mechanics.findIndex(m => m.id === mechanicId);
    return colors[index % colors.length];
  };

  // State declarations
  const [allOrders, setAllOrders] = useState([]); // Store all orders in memory
  const [orders, setOrders] = useState([]); // Filtered orders for display
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    statusCounts: {},
    allOrders: []
  });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [mechanicMenuAnchor, setMechanicMenuAnchor] = useState(null);
  const [updatingMechanic, setUpdatingMechanic] = useState(false);
  const [servicesBladeOpen, setServicesBladeOpen] = useState(false);
  const [selectedOrderForServices, setSelectedOrderForServices] = useState(null);
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [selectedOrderForParts, setSelectedOrderForParts] = useState(null);

  // Get initial status from URL or default to first status
  const getInitialStatus = () => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    const validStatuses = constants.order_statuses.filter(status => status !== 'complete');
    return validStatuses.includes(statusParam) ? statusParam : validStatuses[0];
  };

  const [statusFilter, setStatusFilter] = useState(getInitialStatus());

  // Calculate total hours from services
  const calculateTotalHours = (orders) => {
    return orders.reduce((total, order) => {
      if (order.services && Array.isArray(order.services)) {
        return total + order.services.reduce((serviceTotal, service) => {
          return serviceTotal + (service.time || 0);
        }, 0);
      }
      return total;
    }, 0);
  };

  // Calculate non-complete hours from services
  const calculateNonCompleteHours = (orders) => {
    return orders.reduce((total, order) => {
      if (order.services && Array.isArray(order.services)) {
        return total + order.services.reduce((serviceTotal, service) => {
          // Only count hours for services that are not complete
          if (service.status !== 'complete') {
            return serviceTotal + (service.time || 0);
          }
          return serviceTotal;
        }, 0);
      }
      return total;
    }, 0);
  };

  // Get hours summary for display
  const getHoursSummary = () => {
    const totalHours = calculateTotalHours(orders);
    const nonCompleteHours = calculateNonCompleteHours(orders);
    
    return {
      totalRemaining: nonCompleteHours,
      filtered: totalHours
    };
  };

  // Update URL when status changes
  const updateStatusFilter = (newStatus) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('status', newStatus);
    history.replace({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    setStatusFilter(newStatus);
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Fetch all services once on component mount
  const fetchAllServices = async () => {
    try {
      setLoading(true);
      const snapshot = await firebase.firestore()
        .collection('orders')
        .where('status', 'in', constants.order_statuses.filter(status => status !== 'complete'))
        .get();
      
      if (snapshot.empty) {
        setAllOrders([]);
        return;
      }

      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch car and customer details for each order
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const [carData, customerData, servicesData] = await Promise.all([
          // Fetch car data
          (async () => {
            if (!order.car) return null;
            const carSnapshot = await firebase.firestore()
              .collection('cars')
              .where('stock', '==', order.car)
              .limit(1)
              .get();

            if (carSnapshot.empty) return null;
            const car = carSnapshot.docs[0].data();
            return {
              car_title: `${car.stock} - ${car.year} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ''}`,
              car_thumbnail: car.thumbnail,
              score: Math.round(car.score || 0)
            };
          })(),
          // Fetch customer data
          (async () => {
            if (!order.customer) return null;
            const customerSnapshot = await firebase.firestore()
              .collection('customers')
              .doc(order.customer)
              .get();

            if (!customerSnapshot.exists) return null;
            const customer = customerSnapshot.data();
            return {
              customer_name: `${customer.first_name} ${customer.last_name}`
            };
          })(),
          // Fetch services for this order
          (async () => {
            const servicesSnapshot = await firebase.firestore()
              .collection('services')
              .where('order', '==', order.id)
              .get();

            const services = servicesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            return { services };
          })()
        ]);

        return {
          ...order,
          ...(carData || {}),
          ...(customerData || {}),
          ...(servicesData || {})
        };
      }));

      // Sort by score
      ordersWithDetails.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      setAllOrders(ordersWithDetails);
      setMetrics({ statusCounts: calculateStatusCounts(ordersWithDetails), allOrders: ordersWithDetails });
    } catch (error) {
      console.error('Error fetching services:', error);
      StateManager.setAlertAndOpen("Error fetching services", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts from orders
  const calculateStatusCounts = (orders) => {
    const statusCounts = {};
    constants.order_statuses
      .filter(status => status !== 'complete')
      .forEach(status => {
        statusCounts[status] = orders.filter(order => order.status === status).length;
      });
    return statusCounts;
  };

  // Filter orders based on status and search query
  useEffect(() => {
    if (!allOrders.length) return;

    const searchLower = searchQuery.toLowerCase();
    const filteredOrders = allOrders.filter(order => {
      const matchesStatus = order.status === statusFilter;
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.car_title?.toLowerCase().includes(searchLower) ||
        getMechanicName(order.mechanicId)?.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesSearch;
    });

    setOrders(filteredOrders);
  }, [allOrders, statusFilter, searchQuery]);

  // Update metrics when search query changes
  useEffect(() => {
    if (!allOrders.length) return;

    const searchLower = searchQuery.toLowerCase();
    const filteredOrders = allOrders.filter(order => {
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.car_title?.toLowerCase().includes(searchLower) ||
        getMechanicName(order.mechanicId)?.toLowerCase().includes(searchLower);
      
      return matchesSearch;
    });

    setMetrics(prev => ({ 
      ...prev, 
      statusCounts: calculateStatusCounts(filteredOrders)
    }));
  }, [searchQuery, allOrders]);

  // Update status filter when URL changes
  useEffect(() => {
    const newStatus = getInitialStatus();
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  }, [location.search]);

  // Initial data fetch
  useEffect(() => {
    fetchAllServices();
  }, []);

  // Update local state when status changes
  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    setUpdatingOrderId(selectedOrder.id);

    try {
      await firebase.firestore()
        .collection('orders')
        .doc(selectedOrder.id)
        .update({
          status: newStatus,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      // Update local state
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      StateManager.setAlertAndOpen("Status updated successfully", "success");
    } catch (error) {
      console.error('Error updating status:', error);
      StateManager.setAlertAndOpen("Error updating status", "error");
    } finally {
      setUpdatingStatus(false);
      setUpdatingOrderId(null);
      handleStatusMenuClose();
    }
  };

  // Update local state when mechanic changes
  const handleMechanicChange = async (mechanicId) => {
    if (!selectedOrder) return;

    setUpdatingMechanic(true);
    setUpdatingOrderId(selectedOrder.id);

    try {
      await firebase.firestore()
        .collection('orders')
        .doc(selectedOrder.id)
        .update({
          mechanicId: mechanicId || null,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      // Update local state
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, mechanicId: mechanicId || null }
            : order
        )
      );
      
      StateManager.setAlertAndOpen("Mechanic updated successfully", "success");
    } catch (error) {
      console.error('Error updating mechanic:', error);
      StateManager.setAlertAndOpen("Error updating mechanic", "error");
    } finally {
      setUpdatingMechanic(false);
      setUpdatingOrderId(null);
      handleMechanicMenuClose();
    }
  };

  const handleStatusClick = (event, order) => {
    event.stopPropagation(); // Prevent row click
    setStatusMenuAnchor(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedOrder(null);
  };

  const handleMechanicClick = (event, order) => {
    event.stopPropagation(); // Prevent row click
    setMechanicMenuAnchor(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMechanicMenuClose = () => {
    setMechanicMenuAnchor(null);
    setSelectedOrder(null);
  };

  const handleServicesClick = (event, order) => {
    event.stopPropagation(); // Prevent row click
    setSelectedOrderForServices(order);
    setServicesBladeOpen(true);
  };

  const handlePartsClick = (event, order) => {
    event.stopPropagation(); // Prevent row click
    setSelectedOrderForParts(order);
    setPartsDialogOpen(true);
  };

  const handleServicesBladeClose = () => {
    setServicesBladeOpen(false);
    setSelectedOrderForServices(null);
  };

  const handlePartsDialogClose = () => {
    setPartsDialogOpen(false);
    setSelectedOrderForParts(null);
  };

  const handleServicesUpdate = (updatedServices) => {
    // Update the order in local state with new services
    setAllOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === selectedOrderForServices.id 
          ? { ...order, services: updatedServices }
          : order
      )
    );
  };

  const handlePartsUpdate = (updatedParts) => {
    // Update the order in local state with new parts
    setAllOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === selectedOrderForParts.id 
          ? { ...order, parts: updatedParts }
          : order
      )
    );
  };

  const handleServiceClick = (event, serviceId) => {
    // If ctrl/cmd key is pressed, open in new tab
    if (event.metaKey || event.ctrlKey) {
      window.open(`/service-order/${serviceId}`, '_blank');
      return;
    }
    history.push(`/service-order/${serviceId}`);
  };

  const MetricCard = ({ status, count, color, onClick }) => (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: alpha(color, 0.2),
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        '@media print': {
          cursor: 'default',
          '&:hover': {
            bgcolor: alpha(color, 0.1),
            transform: 'none',
            boxShadow: 'none'
          }
        }
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography component="h2" variant="subtitle2" color="text.secondary">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Typography>
        <Typography component="p" variant="h6">
          {count}
        </Typography>
      </Box>
    </Paper>
  );

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

  return (
    <>
      {/* Print styles */}
      <style>
      {`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }

          .MuiContainer-root {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }

          .MuiTable-root {
            border-collapse: collapse;
            width: 100%;
          }

          .MuiTableCell-root {
            border-bottom: 1px solid #ccc !important;
            padding: 10px 12px !important;
            vertical-align: middle !important;
            font-size: 10pt !important;
          }

          .MuiTableHead-root .MuiTableCell-root {
            background-color: #f5f5f5 !important;
            font-weight: bold !important;
            border-bottom: 2px solid #ccc !important;
          }

          .car-cell-box {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: 200px !important;
          }

          .car-cell-img {
            width: 48px !important;
            height: 48px !important;
            object-fit: cover !important;
            flex-shrink: 0 !important;
          }

          .car-title-print {
            font-size: 10pt !important;
            line-height: 1.4 !important;
            white-space: normal !important;
            word-break: break-word !important;
            display: inline-block !important;
            vertical-align: top !important;
            max-width: 160px !important;
            min-width: 120px !important;
          }
        }
      `}
      </style>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, position: 'relative', minHeight: 'calc(100vh - 100px)' }} className="print-section">
        {/* Header with Mechanic Orders Link and Print Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Service Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Print current view">
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                Print
              </Button>
            </Tooltip>
            <Tooltip title="Open Mechanic Orders in new tab">
              <Button
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open('/mechanic-orders', '_blank')}
                sx={{
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                Mechanic Orders
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Print Header */}
        <Box sx={{ display: 'none' }} className="print-only">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
            Service Dashboard - {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Typography>
          {searchQuery && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Search: "{searchQuery}"
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Printed on: {moment().format('MMMM Do YYYY, h:mm:ss a')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
                  {/* Metrics Cards - Single Row */}
        <Grid item xs={12} className="no-print">
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            overflowX: 'auto',
            pb: 1, // Add padding bottom to show scroll indicator
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(theme.palette.grey[300], 0.3),
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.grey[500], 0.5),
              borderRadius: 3,
              '&:hover': {
                backgroundColor: alpha(theme.palette.grey[600], 0.7),
              },
            },
            '@media (min-width: 768px)': {
              overflowX: 'visible',
              pb: 0,
            }
          }}>
            {constants.order_statuses
              .filter(status => status !== 'complete')
              .map((status) => (
                <Box key={status} sx={{ 
                  flex: 1,
                  minWidth: 140, // Ensure minimum width for mobile
                  '@media (min-width: 768px)': {
                    minWidth: 'auto',
                  }
                }}>
                  <MetricCard
                    status={status}
                    count={metrics.statusCounts[status] || 0}
                    color={getStatusColor(status)}
                    onClick={() => updateStatusFilter(status)}
                  />
                </Box>
              ))}
          </Box>
        </Grid>

          {/* Search and Filter Bar */}
          <Grid item xs={12} className="no-print">
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => updateStatusFilter(e.target.value)}
                >
                  {constants.order_statuses
                    .filter(status => status !== 'complete')
                    .map((status) => (
                      <MenuItem 
                        key={status} 
                        value={status}
                        sx={{
                          color: getStatusColor(status),
                          '&.Mui-selected': {
                            backgroundColor: alpha(getStatusColor(status), 0.1),
                            '&:hover': {
                              backgroundColor: alpha(getStatusColor(status), 0.2),
                            },
                          },
                        }}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Hours Summary */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              px: 1,
              opacity: 0.8,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                opacity: 1
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Total Remaining:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                  }}
                >
                  {getHoursSummary().totalRemaining.toFixed(1)}h
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Filtered:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                  }}
                >
                  {getHoursSummary().filtered.toFixed(1)}h
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Services Table */}
          <Grid item xs={12}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 120 }}>Service ID</TableCell>
                      <TableCell sx={{ minWidth: 250 }}>Car</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Customer</TableCell>
                      <TableCell className="no-print" sx={{ minWidth: 120 }}>Status</TableCell>
                      <TableCell className="no-print" sx={{ minWidth: 140 }}>Mechanic</TableCell>
                      <TableCell className="no-print" sx={{ minWidth: 120 }}>Details</TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>Priority</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order.id}
                          hover
                          onClick={(e) => handleServiceClick(e, order.id)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              '& .status-cell, & .mechanic-cell': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }
                            },
                            '@media print': {
                              cursor: 'default',
                              '&:hover': {
                                '& .status-cell, & .mechanic-cell': {
                                  bgcolor: 'transparent',
                                }
                              }
                            }
                          }}
                        >
                          <TableCell sx={{ minWidth: 120 }}>{order.id}</TableCell>
                          <TableCell sx={{ minWidth: 250 }}>
                            <Box className="car-cell-box" sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5, 
                              minWidth: 0,
                              '@media print': { 
                                alignItems: 'flex-start', 
                                gap: '4px' 
                              } 
                            }}>
                              {order.car_thumbnail ? (
                                <Box
                                  component="img"
                                  src={order.car_thumbnail}
                                  alt={order.car_title}
                                  className="car-cell-img"
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    flexShrink: 0,
                                    '@media print': {
                                      width: 20,
                                      height: 20,
                                      minWidth: 20,
                                      minHeight: 20,
                                      maxWidth: 20,
                                      maxHeight: 20,
                                    }
                                  }}
                                />
                              ) : (
                                <Box
                                  className="car-cell-img no-print"
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha(theme.palette.grey[300], 0.5),
                                    borderRadius: 1,
                                    color: theme.palette.grey[500],
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    flexShrink: 0,
                                    '@media print': {
                                      width: 20,
                                      height: 20,
                                      minWidth: 20,
                                      minHeight: 20,
                                      maxWidth: 20,
                                      maxHeight: 20,
                                    }
                                  }}
                                >
                                  <DirectionsCarIcon sx={{ fontSize: 32, '@media print': { fontSize: 16 } }} />
                                </Box>
                              )}
                              <Typography
                                variant="body2"
                                className="car-title-print"
                                sx={{
                                  fontSize: '0.95rem',
                                  lineHeight: 1.2,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'normal',
                                  ml: 1,
                                  minWidth: 0,
                                  flex: 1,
                                  '@media print': {
                                    fontSize: '10pt',
                                    lineHeight: 1.2,
                                    marginLeft: '4px',
                                    maxWidth: '120px',
                                  },
                                  '@media (max-width: 768px)': {
                                    fontSize: '0.875rem',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                                }}
                              >
                                {order.car_title || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            minWidth: 150,
                            '@media (max-width: 768px)': {
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }
                          }}>
                            {order.customer_name || '-'}
                          </TableCell>
                          <TableCell className="no-print" sx={{ minWidth: 120 }}>
                            <Box
                              onClick={(e) => handleStatusClick(e, order)}
                              className="status-cell"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(getStatusColor(order.status), 0.1),
                                color: getStatusColor(order.status),
                                fontWeight: 'medium',
                                textTransform: 'capitalize',
                                cursor: 'pointer',
                                minWidth: 100,
                                position: 'relative',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: alpha(getStatusColor(order.status), 0.2),
                                },
                                '@media print': {
                                  cursor: 'default',
                                  '&:hover': {
                                    bgcolor: alpha(getStatusColor(order.status), 0.1),
                                  }
                                }
                              }}
                            >
                              {updatingStatus && updatingOrderId === order.id ? (
                                <CircularProgress
                                  size={16}
                                  sx={{
                                    color: 'inherit',
                                    position: 'absolute',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                  }}
                                />
                              ) : (
                                <>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'currentColor',
                                      flexShrink: 0
                                    }}
                                  />
                                  <Typography sx={{ 
                                    opacity: updatingStatus && updatingOrderId === order.id ? 0 : 1,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {order.status}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className="no-print" sx={{ minWidth: 140 }}>
                            <Box
                              onClick={(e) => handleMechanicClick(e, order)}
                              className="mechanic-cell"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(getMechanicColor(order.mechanicId), 0.1),
                                color: getMechanicColor(order.mechanicId),
                                fontWeight: 'medium',
                                cursor: 'pointer',
                                minWidth: 120,
                                position: 'relative',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: alpha(getMechanicColor(order.mechanicId), 0.2),
                                },
                                '@media print': {
                                  cursor: 'default',
                                  '&:hover': {
                                    bgcolor: alpha(getMechanicColor(order.mechanicId), 0.1),
                                  }
                                }
                              }}
                            >
                              {updatingMechanic && updatingOrderId === order.id ? (
                                <CircularProgress
                                  size={16}
                                  sx={{
                                    color: 'inherit',
                                    position: 'absolute',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                  }}
                                />
                              ) : (
                                <>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'currentColor',
                                      flexShrink: 0
                                    }}
                                  />
                                  <Typography sx={{ 
                                    opacity: updatingMechanic && updatingOrderId === order.id ? 0 : 1,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {getMechanicName(order.mechanicId)}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className="no-print" sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => handleServicesClick(e, order)}
                                startIcon={<BuildIcon />}
                                sx={{
                                  minWidth: 100,
                                  textTransform: 'none',
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  }
                                }}
                              >
                                Services
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => handlePartsClick(e, order)}
                                startIcon={<InventoryIcon />}
                                sx={{
                                  minWidth: 100,
                                  textTransform: 'none',
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  }
                                }}
                              >
                                Parts
                              </Button>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 80 }}>
                            <Typography
                              sx={{
                                fontWeight: 'medium',
                                color: theme.palette.primary.main
                              }}
                            >
                              {order.score || 0}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor) && !updatingStatus}
          onClose={handleStatusMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
            }
          }}
        >
          {constants.order_statuses
            .filter(status => status !== 'complete' && status !== selectedOrder?.status)
            .map((status) => (
              <MenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updatingStatus}
                sx={{
                  color: getStatusColor(status),
                  '&:hover': {
                    bgcolor: alpha(getStatusColor(status), 0.1),
                  },
                  '&.Mui-disabled': {
                    opacity: 0.7
                  }
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getStatusColor(status)
                    }}
                  />
                </ListItemIcon>
                <ListItemText>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </ListItemText>
              </MenuItem>
            ))}
        </Menu>

        <Menu
          anchorEl={mechanicMenuAnchor}
          open={Boolean(mechanicMenuAnchor) && !updatingMechanic}
          onClose={handleMechanicMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
            }
          }}
        >
          <MenuItem
            onClick={() => handleMechanicChange('')}
            disabled={updatingMechanic}
            selected={!selectedOrder?.mechanicId}
            sx={{
              color: theme.palette.grey[500],
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.1),
              },
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.grey[500], 0.2),
                '&:hover': {
                  bgcolor: alpha(theme.palette.grey[500], 0.3),
                },
              },
              '&.Mui-disabled': {
                opacity: 0.7
              }
            }}
          >
            <ListItemIcon>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.grey[500]
                }}
              />
            </ListItemIcon>
            <ListItemText>None</ListItemText>
          </MenuItem>
          {constants.mechanics.map((mechanic) => (
            <MenuItem
              key={mechanic.id}
              onClick={() => handleMechanicChange(mechanic.id)}
              disabled={updatingMechanic}
              selected={selectedOrder?.mechanicId === mechanic.id}
              sx={{
                color: getMechanicColor(mechanic.id),
                '&:hover': {
                  bgcolor: alpha(getMechanicColor(mechanic.id), 0.1),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(getMechanicColor(mechanic.id), 0.2),
                  '&:hover': {
                    bgcolor: alpha(getMechanicColor(mechanic.id), 0.3),
                  },
                },
                '&.Mui-disabled': {
                  opacity: 0.7
                }
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getMechanicColor(mechanic.id)
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                {mechanic.name}
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* Services Blade Dialog */}
        <Dialog
          open={servicesBladeOpen}
          onClose={handleServicesBladeClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              height: '80vh',
              maxHeight: '80vh'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Services - {selectedOrderForServices?.id}
              </Typography>
              <IconButton onClick={handleServicesBladeClose}>
                <CheckIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {selectedOrderForServices && (
              <ServicesBlade
                order={selectedOrderForServices}
                onClose={handleServicesBladeClose}
                onUpdate={handleServicesUpdate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Parts Dialog */}
        <Dialog
          open={partsDialogOpen}
          onClose={handlePartsDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              height: '80vh',
              maxHeight: '80vh'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Parts - {selectedOrderForParts?.id}
              </Typography>
              <IconButton onClick={handlePartsDialogClose}>
                <CheckIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {selectedOrderForParts && (
              <PartsBlade
                order={selectedOrderForParts}
                onClose={handlePartsDialogClose}
                onUpdate={handlePartsUpdate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* <Fab
          color="primary"
          aria-label="add"
          onClick={() => history.push('/service/new')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            '& .MuiSvgIcon-root': {
              fontSize: 24
            }
          }}
        >
          <AddIcon />
        </Fab> */}
      </Container>
    </>
  );
};

export default ServiceDashboardPage; 