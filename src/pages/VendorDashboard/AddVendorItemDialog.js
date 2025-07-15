import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Autocomplete,
  Chip,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import constants from '../../utilities/constants';

const AddVendorItemDialog = ({ open, onClose, vendor, onItemAdded }) => {
  const [formData, setFormData] = useState({
    stock: '',
    pricingItem: null,
    customAmount: '',
    customMemo: ''
  });
  const [manualStockMode, setManualStockMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  const [searchingCars, setSearchingCars] = useState(false);

  // Get vendor pricing from constants
  const vendorData = constants.vendors.find(v => v.name === vendor);
  const pricingItems = vendorData?.pricing || [];

  // Fetch cars when dialog opens
  useEffect(() => {
    if (open) {
      fetchCars();
    }
  }, [open]);

  // Filter cars based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCars(cars);
      return;
    }

    const filtered = cars.filter(car => {
      const searchLower = searchQuery.toLowerCase();
      const carTitle = `${car.stock} ${car.year || ''} ${car.make || ''} ${car.model || ''} ${car.trim || ''}`.toLowerCase();
      return carTitle.includes(searchLower) || car.stock.toLowerCase().includes(searchLower);
    });
    setFilteredCars(filtered);
  }, [cars, searchQuery]);

  const fetchCars = async () => {
    try {
      setSearchingCars(true);
      const snapshot = await firebase.firestore()
        .collection('cars')
        .where('status', 'in', ['intake', 'marketing', 'active'])
        .limit(300)
        .get();

      const carsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCars(carsData);
      setFilteredCars(carsData);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setSearchingCars(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCarSelect = (car) => {
    setFormData(prev => ({ ...prev, stock: car?.stock || '' }));
    if (errors.stock) {
      setErrors(prev => ({ ...prev, stock: null }));
    }
  };

  const handleManualStockChange = (e) => {
    setFormData(prev => ({ ...prev, stock: e.target.value }));
    if (errors.stock) {
      setErrors(prev => ({ ...prev, stock: null }));
    }
  };

  const handlePricingItemSelect = (item) => {
    setFormData(prev => ({ 
      ...prev, 
      pricingItem: item,
      customAmount: item?.cost?.replace('$', '').replace(',', '') || '',
      customMemo: item?.type || ''
    }));
    if (errors.pricingItem) {
      setErrors(prev => ({ ...prev, pricingItem: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.stock) newErrors.stock = 'Car is required';
    if (!formData.pricingItem && !formData.customMemo) newErrors.pricingItem = 'Pricing item or custom memo is required';
    if (!formData.customAmount || isNaN(parseFloat(formData.customAmount))) newErrors.customAmount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const purchaseData = {
        vendor: vendor,
        stock: formData.stock,
        amount: parseFloat(formData.customAmount),
        memo: formData.customMemo,
        date: moment().format('YYYY/MM/DD'),
        isPayable: true,
        type: "repair",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebase.firestore().collection('purchases').add(purchaseData);
      
      handleClose();
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
      setErrors({ submit: 'Failed to add purchase. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      stock: '',
      pricingItem: null,
      customAmount: '',
      customMemo: ''
    });
    setErrors({});
    setSearchQuery('');
    setManualStockMode(false);
    onClose();
  };

  const selectedCar = cars.find(car => car.stock === formData.stock);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          Add Purchase - {vendor}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Car Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Select Car</Typography>
            
            {!manualStockMode ? (
              <>
                <Autocomplete
                  options={filteredCars}
                  getOptionLabel={(option) => `${option.stock} - ${option.year || ''} ${option.make || ''} ${option.model || ''} ${option.trim || ''}`}
                  value={selectedCar || null}
                  onChange={(event, newValue) => handleCarSelect(newValue)}
                  loading={searchingCars}
                  filterOptions={(x) => x} // Disable built-in filtering since we handle it manually
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search for a car..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      error={!!errors.stock}
                      helperText={errors.stock}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {searchingCars ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        {option.thumbnail && (
                          <Avatar
                            src={option.thumbnail}
                            sx={{ width: 40, height: 40 }}
                            variant="rounded"
                          />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.stock}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.year} {option.make} {option.model} {option.trim}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => setManualStockMode(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Can't find the car? Enter stock number manually
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Stock Number"
                  value={formData.stock}
                  onChange={handleManualStockChange}
                  placeholder="e.g., SN1234"
                  error={!!errors.stock}
                  helperText={errors.stock || "Enter the stock number manually"}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => setManualStockMode(false)}
                    sx={{ textTransform: 'none' }}
                  >
                    Back to search
                  </Button>
                </Box>
              </>
            )}
          </Grid>

          {/* Pricing Items */}
          {pricingItems.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Service</Typography>
              <FormControl fullWidth error={!!errors.pricingItem}>
                <Select
                  value={formData.pricingItem || ''}
                  onChange={(e) => handlePricingItemSelect(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Choose a service...
                  </MenuItem>
                  {pricingItems.map((item, index) => (
                    <MenuItem key={index} value={item}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.type} - {item.cost}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.pricingItem && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.pricingItem}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          )}

          {/* Custom Memo */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Memo/Description"
              value={formData.customMemo}
              onChange={handleChange}
              name="customMemo"
              multiline
              rows={2}
              placeholder={pricingItems.length > 0 ? "Or enter custom description..." : "Enter description..."}
            />
          </Grid>

          {/* Amount */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.customAmount}
              onChange={handleChange}
              name="customAmount"
              InputProps={{
                startAdornment: '$'
              }}
              error={!!errors.customAmount}
              helperText={errors.customAmount}
            />
          </Grid>
        </Grid>

        {errors.submit && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {errors.submit}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVendorItemDialog; 