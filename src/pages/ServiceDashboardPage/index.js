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
import ServiceEditForm from '../ServiceOrderPage/ServiceEditForm';

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
  const [excludeCustomerFilter, setExcludeCustomerFilter] = useState(false);
  const [hideNeedsPartsFilter, setHideNeedsPartsFilter] = useState(false);
  const [serviceEditDialogOpen, setServiceEditDialogOpen] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);
  const [updatingService, setUpdatingService] = useState(false);

  // Real-time listener for the order open in ServicesBlade
  useEffect(() => {
    if (!servicesBladeOpen || !selectedOrderForServices?.id) return;

    const unsubscribe = firebase.firestore()
      .collection('orders')
      .doc(selectedOrderForServices.id)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const updatedOrder = doc.data();
          
          // Update the order in local state
          setAllOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrderForServices.id 
                ? { ...order, ...updatedOrder }
                : order
            )
          );
          
          // Update the selectedOrderForServices to ensure ServicesBlade gets fresh data
          setSelectedOrderForServices(prev => ({ ...prev, ...updatedOrder }));
        }
      }, (error) => {
        console.error('Error in real-time listener for order:', error);
      });

    // Cleanup subscription when ServicesBlade closes or order changes
    return () => unsubscribe();
  }, [servicesBladeOpen, selectedOrderForServices?.id]);

  // Real-time listener for services collection to catch new services
  useEffect(() => {
    if (!servicesBladeOpen || !selectedOrderForServices?.id) return;

    const unsubscribe = firebase.firestore()
      .collection('services')
      .where('order', '==', selectedOrderForServices.id)
      .onSnapshot((snapshot) => {
        const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Update the order's services in local state
        setAllOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === selectedOrderForServices.id 
              ? { ...order, services }
              : order
          )
        );
        
        // Update the selectedOrderForServices to ensure ServicesBlade gets fresh data
        setSelectedOrderForServices(prev => ({ ...prev, services }));
      }, (error) => {
        console.error('Error in real-time listener for services:', error);
      });

    // Cleanup subscription when ServicesBlade closes or order changes
    return () => unsubscribe();
  }, [servicesBladeOpen, selectedOrderForServices?.id]);

  // Real-time listener for parts collection to catch new parts
  useEffect(() => {
    if (!partsDialogOpen || !selectedOrderForParts?.id) return;

    const unsubscribe = firebase.firestore()
      .collection('parts')
      .where('order', '==', selectedOrderForParts.id)
      .onSnapshot((snapshot) => {
        const parts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Update the order's parts in local state
        setAllOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === selectedOrderForParts.id 
              ? { ...order, parts }
              : order
          )
        );
        
        // Update the selectedOrderForParts to ensure PartsBlade gets fresh data
        setSelectedOrderForParts(prev => ({ ...prev, parts }));
      }, (error) => {
        console.error('Error in real-time listener for parts:', error);
      });

    // Cleanup subscription when PartsBlade closes or order changes
    return () => unsubscribe();
  }, [partsDialogOpen, selectedOrderForParts?.id]);

  // Real-time listener for the order open in PartsBlade
  useEffect(() => {
    if (!partsDialogOpen || !selectedOrderForParts?.id) return;

    const unsubscribe = firebase.firestore()
      .collection('orders')
      .doc(selectedOrderForParts.id)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const updatedOrder = doc.data();
          
          // Update the order in local state
          setAllOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrderForParts.id 
                ? { ...order, ...updatedOrder }
                : order
            )
          );
          
          // Update the selectedOrderForParts to ensure PartsBlade gets fresh data
          setSelectedOrderForParts(prev => ({ ...prev, ...updatedOrder }));
        }
      }, (error) => {
        console.error('Error in real-time listener for order:', error);
      });

    // Cleanup subscription when PartsBlade closes or order changes
    return () => unsubscribe();
  }, [partsDialogOpen, selectedOrderForParts?.id]);

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

  // Real-time listener for all services
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = firebase.firestore()
      .collection('orders')
      .where('status', 'in', constants.order_statuses.filter(status => status !== 'complete'))
      .onSnapshot(async (snapshot) => {
        try {
          if (snapshot.empty) {
            setAllOrders([]);
            setMetrics({ statusCounts: calculateStatusCounts([]), allOrders: [] });
            setLoading(false);
            return;
          }

          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Fetch car and customer details for each order
          const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            const [carData, customerData, servicesData, partsData] = await Promise.all([
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
              })(),
              // Fetch parts for this order
              (async () => {
                const partsSnapshot = await firebase.firestore()
                  .collection('parts')
                  .where('order', '==', order.id)
                  .get();

                const parts = partsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                return { parts };
              })()
            ]);

            return {
              ...order,
              ...(carData || {}),
              ...(customerData || {}),
              ...(servicesData || {}),
              ...(partsData || {})
            };
          }));

          // Sort by score
          ordersWithDetails.sort((a, b) => (b.score || 0) - (a.score || 0));
          
          setAllOrders(ordersWithDetails);
          setMetrics({ statusCounts: calculateStatusCounts(ordersWithDetails), allOrders: ordersWithDetails });
        } catch (error) {
          console.error('Error processing services snapshot:', error);
          StateManager.setAlertAndOpen("Error processing services data", "error");
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Error in services snapshot listener:', error);
        StateManager.setAlertAndOpen("Error listening to services updates", "error");
        setLoading(false);
      });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, []);

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

  // Check if an order has incomplete parts
  const hasIncompleteParts = (order) => {
    if (!order.parts || !Array.isArray(order.parts)) return false;
    return order.parts.some(part => 
      part.status !== 'complete' && part.status !== 'returning'
    );
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
      
      // Exclude specific customer if filter is active
      const excludedCustomer = excludeCustomerFilter && order.customer === '9c0d88f5-84f9-454d-833d-a8ced9adad49';
      
      // Hide orders that need parts if filter is active
      const hiddenNeedsParts = hideNeedsPartsFilter && hasIncompleteParts(order);
      
      return matchesStatus && matchesSearch && !excludedCustomer && !hiddenNeedsParts;
    });

    setOrders(filteredOrders);
  }, [allOrders, statusFilter, searchQuery, excludeCustomerFilter, hideNeedsPartsFilter]);

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
      
      // Exclude specific customer if filter is active
      const excludedCustomer = excludeCustomerFilter && order.customer === '9c0d88f5-84f9-454d-833d-a8ced9adad49';
      
      // Hide orders that need parts if filter is active
      const hiddenNeedsParts = hideNeedsPartsFilter && hasIncompleteParts(order);
      
      return matchesSearch && !excludedCustomer && !hiddenNeedsParts;
    });

    setMetrics(prev => ({ 
      ...prev, 
      statusCounts: calculateStatusCounts(filteredOrders)
    }));
  }, [searchQuery, allOrders, excludeCustomerFilter, hideNeedsPartsFilter]);

  // Update status filter when URL changes
  useEffect(() => {
    const newStatus = getInitialStatus();
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  }, [location.search]);



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
    
    // Also update the selectedOrderForServices to ensure ServicesBlade gets fresh data immediately
    if (selectedOrderForServices) {
      setSelectedOrderForServices(prev => ({ ...prev, services: updatedServices }));
    }
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
    
    // Also update the selectedOrderForParts to ensure PartsBlade gets fresh data immediately
    if (selectedOrderForParts) {
      setSelectedOrderForParts(prev => ({ ...prev, parts: updatedParts }));
    }
  };

  const handleServiceEditDialogClose = () => {
    setServiceEditDialogOpen(false);
    setSelectedServiceForEdit(null);
  };

  const handleServiceUpdate = (updatedService) => {
    // Update the service in the local state
    if (selectedServiceForEdit) {
      setUpdatingService(true);
      
      setAllOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.services) {
            const updatedServices = order.services.map(service => 
              service.id === selectedServiceForEdit.id 
                ? { ...service, ...updatedService }
                : service
            );
            return { ...order, services: updatedServices };
          }
          return order;
        })
      );

      // Also update the selectedServiceForEdit to reflect changes immediately
      setSelectedServiceForEdit(prev => ({ ...prev, ...updatedService }));

      // Save the updated service to the database
      firebase.firestore()
        .collection('services')
        .doc(selectedServiceForEdit.id)
        .update(updatedService)
        .then(() => {
          setUpdatingService(false);
          // Optionally close the dialog after successful update
          // Uncomment the next line if you want auto-close behavior
          // handleServiceEditDialogClose();
        })
        .catch(error => {
          console.error('Error updating service:', error);
          setUpdatingService(false);
          // You might want to show an error toast here
        });
    }
  };

  const handleServiceEditClick = (service) => {
    setSelectedServiceForEdit(service);
    setServiceEditDialogOpen(true);
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
        {/* Header with Mechanic Orders Link, Parts Dashboard Link and Print Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Service Dashboard
            </Typography>
            {excludeCustomerFilter && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'error.main', 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                Customer Filtered
              </Typography>
            )}
          </Box>
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
                  display: { xs: 'none', md: 'flex' }, // Hide on mobile
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                Print
              </Button>
            </Tooltip>
            <Tooltip title="Open Parts Dashboard in new tab">
              <Button
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open('/parts-dashboard', '_blank')}
                sx={{
                  textTransform: 'none',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  px: 2,
                  py: 1,
                  display: { xs: 'none', md: 'flex' }, // Hide on mobile
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                Parts Dashboard
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
                  display: { xs: 'none', md: 'flex' }, // Hide on mobile
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
          {excludeCustomerFilter && (
            <Typography variant="body1" sx={{ mb: 2, color: 'error.main' }}>
              Filtered: Excluding specific customer orders
            </Typography>
          )}
          {hideNeedsPartsFilter && (
            <Typography variant="body1" sx={{ mb: 2, color: 'error.main' }}>
              Filtered: Hiding orders that need parts
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
            <Paper sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' }, 
              gap: 2 
            }}>
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
              <FormControl sx={{ 
                minWidth: { xs: '100%', md: 200 },
                width: { xs: '100%', md: 'auto' }
              }}>
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
              <Tooltip title={excludeCustomerFilter ? "Show all customers" : "Hide Skyway orders"}>
                <ToggleButton
                  value="excludeCustomer"
                  selected={excludeCustomerFilter}
                  onChange={() => setExcludeCustomerFilter(!excludeCustomerFilter)}
                  sx={{
                    textTransform: 'none',
                    borderColor: excludeCustomerFilter ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.3),
                    color: excludeCustomerFilter ? theme.palette.error.main : theme.palette.primary.main,
                    px: 2,
                    py: 1,
                    height: { xs: 48, md: 56 }, // Smaller height on mobile
                    width: { xs: '100%', md: 'auto' }, // Full width on mobile
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      borderColor: theme.palette.error.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.15),
                      }
                    },
                    '&:hover': {
                      borderColor: excludeCustomerFilter ? theme.palette.error.main : theme.palette.primary.main,
                      bgcolor: excludeCustomerFilter ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.primary.main, 0.05),
                    }
                  }}
                >
                  {excludeCustomerFilter ? "Show All" : "Hide Skyway"}
                </ToggleButton>
              </Tooltip>
              <Tooltip title={hideNeedsPartsFilter ? "Show all orders" : "Hide orders that need parts"}>
                <ToggleButton
                  value="hideNeedsParts"
                  selected={hideNeedsPartsFilter}
                  onChange={() => setHideNeedsPartsFilter(!hideNeedsPartsFilter)}
                  sx={{
                    textTransform: 'none',
                    borderColor: hideNeedsPartsFilter ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.3),
                    color: hideNeedsPartsFilter ? theme.palette.error.main : theme.palette.primary.main,
                    px: 2,
                    py: 1,
                    height: { xs: 48, md: 56 }, // Smaller height on mobile
                    width: { xs: '100%', md: 'auto' }, // Full width on mobile
                    whiteSpace: 'nowrap', // Prevent text wrapping
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      borderColor: theme.palette.error.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.15),
                      }
                    },
                    '&:hover': {
                      borderColor: hideNeedsPartsFilter ? theme.palette.error.main : theme.palette.primary.main,
                      bgcolor: hideNeedsPartsFilter ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.primary.main, 0.05),
                    }
                  }}
                >
                  {hideNeedsPartsFilter ? "Show All" : "Hide Needs Parts"}
                </ToggleButton>
              </Tooltip>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                              {hasIncompleteParts(order) && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    color: theme.palette.error.main,
                                    fontSize: '0.75rem',
                                    fontWeight: 'medium',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <InventoryIcon sx={{ fontSize: 16 }} />
                                  needs parts
                                </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  Services - {selectedOrderForServices?.id}
                </Typography>
                <Tooltip title="Open Service Order">
                  <IconButton
                    onClick={() => window.open(`/service-order/${selectedOrderForServices?.id}?tab=services`, '_blank')}
                    size="small"
                    sx={{ color: theme.palette.info.main }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
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
                onServiceEdit={handleServiceEditClick}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  Parts - {selectedOrderForParts?.id}
                </Typography>
                <Tooltip title="Open Parts Dashboard">
                  <IconButton
                    onClick={() => window.open(`/parts-dashboard`, '_blank')}
                    size="small"
                    sx={{ color: theme.palette.info.main }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
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

        {/* Service Edit Dialog */}
        <Dialog
          open={serviceEditDialogOpen}
          onClose={handleServiceEditDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">
                  Edit Service - {selectedServiceForEdit?.name || 'Service'}
                  {updatingService && (
                    <CircularProgress
                      size={16}
                      sx={{ ml: 1, color: 'inherit' }}
                    />
                  )}
                </Typography>
                {selectedServiceForEdit && (
                  <Typography variant="body2" color="text.secondary">
                    Order: {selectedServiceForEdit.order || 'N/A'}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={handleServiceEditDialogClose}>
                <CheckIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedServiceForEdit && (
              <ServiceEditForm
                service={selectedServiceForEdit}
                onUpdate={handleServiceUpdate}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleServiceEditDialogClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ServiceDashboardPage; 