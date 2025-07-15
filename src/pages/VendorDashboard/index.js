import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Chip,
  Avatar
} from '@mui/material';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import AddVendorItemDialog from './AddVendorItemDialog';

const VendorDashboard = () => {
  // Component setup
  StateManager.setTitle("Vendor Dashboard");
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();

  // Get vendor from URL params or use first vendor as default
  const { vendor: urlVendor } = useParams();
  const isManager = StateManager.isManager();
  
  // Target vendors
  const TARGET_VENDORS = constants.vendors.map(v => v.name);
  
  // Determine initial vendor - if manager, use URL param or first vendor; if not manager, use URL param only
  const getInitialVendor = () => {
    if (urlVendor) {
      // Decode URL parameter and format it properly
      const decodedVendor = decodeURIComponent(urlVendor).replace(/-/g, ' ');
      return TARGET_VENDORS.find(v => v.toLowerCase() === decodedVendor.toLowerCase()) || TARGET_VENDORS[0];
    }
    return isManager ? TARGET_VENDORS[0] : TARGET_VENDORS[0];
  };

  // State declarations
  const [allPurchases, setAllPurchases] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(getInitialVendor());
  const [startDate, setStartDate] = useState(moment().startOf('month'));
  const [endDate, setEndDate] = useState(moment().endOf('month'));
  const [metrics, setMetrics] = useState({
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    totalPurchases: 0,
    paidPurchases: 0,
    unpaidPurchases: 0
  });
  const [addPurchaseDialogOpen, setAddPurchaseDialogOpen] = useState(false);

  // Fetch all purchases for target vendors
  const fetchAllPurchases = async () => {
    try {
      setLoading(true);
      const snapshot = await firebase.firestore()
        .collection('purchases')
        .where('vendor', 'in', TARGET_VENDORS)
        .where('date', '>=', startDate.format('YYYY/MM/DD'))
        .where('date', '<=', endDate.format('YYYY/MM/DD'))
        .get();
      
      if (snapshot.empty) {
        setAllPurchases([]);
        return;
      }

      const purchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => moment(b.date, 'YYYY/MM/DD').diff(moment(a.date, 'YYYY/MM/DD')));

      // Fetch car details for each purchase
      const purchasesWithCarDetails = await Promise.all(purchases.map(async (purchase) => {
        if (!purchase.stock) return purchase;

        try {
          const carSnapshot = await firebase.firestore()
            .collection('cars')
            .doc(purchase.stock)
            .get();

          if (carSnapshot.exists) {
            const carData = carSnapshot.data();
            return {
              ...purchase,
              carInfo: {
                stock: carData.stock,
                year: carData.year,
                make: carData.make,
                model: carData.model,
                trim: carData.trim,
                thumbnail: carData.thumbnail
              }
            };
          }
        } catch (error) {
          console.error('Error fetching car data:', error);
        }

        return purchase;
      }));

      setAllPurchases(purchasesWithCarDetails);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      StateManager.setAlertAndOpen("Error fetching purchases", "error");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized filtered purchases for better performance
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter(purchase => {
      const matchesVendor = purchase.vendor === selectedVendor;
      const purchaseDate = moment(purchase.date, 'YYYY/MM/DD');
      const matchesDateRange = purchaseDate.isBetween(startDate, endDate, 'day', '[]');
      
      if (!matchesVendor || !matchesDateRange) return false;
      
      // Only apply search filter if there's a search query
      if (!debouncedSearchQuery) return true;
      
      const searchLower = debouncedSearchQuery.toLowerCase();
      const carTitle = `${purchase.carInfo?.year || ''} ${purchase.carInfo?.make || ''} ${purchase.carInfo?.model || ''} ${purchase.carInfo?.trim || ''}`.trim();
      
      return (
        purchase.memo?.toLowerCase().includes(searchLower) ||
        purchase.stock?.toLowerCase().includes(searchLower) ||
        carTitle.toLowerCase().includes(searchLower) ||
        purchase.carInfo?.year?.toString().toLowerCase().includes(searchLower) ||
        purchase.carInfo?.make?.toLowerCase().includes(searchLower) ||
        purchase.carInfo?.model?.toLowerCase().includes(searchLower) ||
        purchase.carInfo?.trim?.toLowerCase().includes(searchLower)
      );
    });
  }, [allPurchases, selectedVendor, startDate, endDate, debouncedSearchQuery]);

  // Update purchases when filtered results change
  useEffect(() => {
    setPurchases(filteredPurchases);
  }, [filteredPurchases]);

  // Calculate metrics
  useEffect(() => {
    const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
    const paidAmount = purchases.reduce((sum, purchase) => 
      sum + (!purchase.isPayable ? (purchase.amount || 0) : 0), 0);
    const unpaidAmount = purchases.reduce((sum, purchase) => 
      sum + (purchase.isPayable ? (purchase.amount || 0) : 0), 0);
    const totalPurchases = purchases.length;
    const paidPurchases = purchases.filter(p => !p.isPayable).length;
    const unpaidPurchases = purchases.filter(p => p.isPayable).length;

    setMetrics({
      totalAmount,
      paidAmount,
      unpaidAmount,
      totalPurchases,
      paidPurchases,
      unpaidPurchases
    });
  }, [purchases]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllPurchases();
  }, [startDate, endDate]);



  // Update URL when vendor changes (only for managers)
  useEffect(() => {
    if (isManager && selectedVendor) {
      const vendorSlug = selectedVendor.toLowerCase().replace(/\s+/g, '-');
      history.replace(`/vendor-dashboard/${vendorSlug}`);
    }
  }, [selectedVendor, isManager, history]);

  // Handle adding new purchase
  const handleAddPurchase = () => {
    setAddPurchaseDialogOpen(true);
  };

  // Handle purchase added callback
  const handlePurchaseAdded = () => {
    StateManager.setAlertAndOpen("Purchase added successfully", "success");
    fetchAllPurchases(); // Refresh data
  };

  // Handle toggling paid status
  const handleTogglePaid = async (purchase) => {
    try {
      const updates = {
        isPayable: !purchase.isPayable,
        paidDate: !purchase.isPayable ? moment().format('YYYY/MM/DD') : null,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await firebase.firestore().collection('purchases').doc(purchase.id).update(updates);
      fetchAllPurchases(); // Refresh data
    } catch (error) {
      console.error('Error toggling purchase paid status:', error);
      StateManager.setAlertAndOpen("Error updating purchase status", "error");
    }
  };

  // Metric Card Component
  const MetricCard = ({ title, value, subtitle, color, icon: Icon }) => (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: alpha(color, 0.2),
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography component="h2" variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography component="p" variant="h6" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography component="p" variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );

  // Car info display component
  const CarInfo = ({ carInfo }) => {
    if (!carInfo) return <Typography color="text.secondary">No car info</Typography>;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {carInfo.thumbnail && (
          <Avatar
            src={carInfo.thumbnail}
            sx={{ width: 32, height: 32 }}
            variant="rounded"
          />
        )}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {carInfo.stock}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {[carInfo.year, carInfo.make, carInfo.model, carInfo.trim]
              .filter(Boolean)
              .join(' ')}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Vendor Dashboard
        </Typography>
        <Fab
          color="primary"
          aria-label="add purchase"
          onClick={() => setAddPurchaseDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Vendor Selection - Only show for managers */}
      {isManager && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Select Vendor</Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  displayEmpty
                >
                  {TARGET_VENDORS.map((vendor) => (
                    <MenuItem key={vendor} value={vendor}>
                      {vendor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Show current vendor for non-managers */}
      {!isManager && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>Current Vendor</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                {selectedVendor}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Total Amount"
            value={`$${metrics.totalAmount.toLocaleString()}`}
            subtitle={`${metrics.totalPurchases} purchases`}
            color={theme.palette.primary.main}
            icon={AttachMoneyIcon}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Paid Amount"
            value={`$${metrics.paidAmount.toLocaleString()}`}
            subtitle={`${metrics.paidPurchases} paid`}
            color={theme.palette.success.main}
            icon={CheckCircleIcon}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Unpaid Amount"
            value={`$${metrics.unpaidAmount.toLocaleString()}`}
            subtitle={`${metrics.unpaidPurchases} unpaid`}
            color={theme.palette.warning.main}
            icon={PendingIcon}
          />
        </Grid>
      </Grid>

      {/* Date Range and Search */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
                         <TextField
               fullWidth
               variant="outlined"
               placeholder="Search purchases..."
               value={searchQuery}
               autoComplete="off"
               onChange={(e) => setSearchQuery(e.target.value)}
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <SearchIcon />
                   </InputAdornment>
                 ),
               }}
               size="small"
               sx={{ minWidth: 300 }}
             />
             {debouncedSearchQuery !== searchQuery && (
               <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                 Searching...
               </Typography>
             )}
          </Paper>
        </Grid>
      </Grid>

      {/* Purchases Table */}
      <Grid item xs={12}>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 800 }}>
                             <TableHead>
                 <TableRow>
                   <TableCell sx={{ minWidth: 100 }}>Paid</TableCell>
                   <TableCell sx={{ minWidth: 120 }}>Date</TableCell>
                   <TableCell sx={{ minWidth: 200 }}>Car Info</TableCell>
                   <TableCell sx={{ minWidth: 300 }}>Memo</TableCell>
                   <TableCell align="right" sx={{ minWidth: 120 }}>Amount</TableCell>
                   {isManager && (
                     <TableCell align="center" sx={{ minWidth: 100 }}>Actions</TableCell>
                   )}
                 </TableRow>
               </TableHead>
              <TableBody>
                                 {loading ? (
                   <TableRow>
                     <TableCell colSpan={isManager ? 6 : 5} align="center">
                       <CircularProgress />
                     </TableCell>
                   </TableRow>
                 ) : purchases.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={isManager ? 6 : 5} align="center">
                       No purchases found
                     </TableCell>
                   </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id} hover>
                      <TableCell>
                        <Chip
                          label={purchase.isPayable ? "Unpaid" : "Paid"}
                          color={purchase.isPayable ? "warning" : "success"}
                          size="small"
                          onClick={() => handleTogglePaid(purchase)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        {moment(purchase.date, 'YYYY/MM/DD').format('MM/DD/YYYY')}
                      </TableCell>
                      <TableCell>
                        <CarInfo carInfo={purchase.carInfo} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 250 }}>
                          {purchase.memo}
                        </Typography>
                      </TableCell>
                                             <TableCell align="right">
                         <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           ${(purchase.amount || 0).toFixed(2)}
                         </Typography>
                       </TableCell>
                       {isManager && (
                         <TableCell align="center">
                           <Tooltip title="Toggle paid status">
                             <IconButton
                               size="small"
                               onClick={() => handleTogglePaid(purchase)}
                             >
                               {purchase.isPayable ? <CheckCircleIcon /> : <PendingIcon />}
                             </IconButton>
                           </Tooltip>
                         </TableCell>
                       )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Grid>

      {/* Add Purchase Dialog */}
      <AddVendorItemDialog
        open={addPurchaseDialogOpen}
        onClose={() => setAddPurchaseDialogOpen(false)}
        vendor={selectedVendor}
        onItemAdded={handlePurchaseAdded}
      />
    </Container>
  );
};

export default VendorDashboard;
