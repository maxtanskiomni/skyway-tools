import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import { StateManager } from '../../utilities/stateManager.js';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import firebase from '../../utilities/firebase';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RequestManager from '../../utilities/requestManager';
import CircularProgress from '@mui/material/CircularProgress';
const db = firebase.firestore();

export default function Invoice({ order }) {
  const [selectedServices, setSelectedServices] = useState(order.services || []);
  const [selectedParts, setSelectedParts] = useState(order.expenses || []);
  const [partMargins, setPartMargins] = useState({});
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(order.taxEnabled === false ? false : true);
  const [invalidMargins, setInvalidMargins] = useState(false);
  const [shopSuppliesFee, setShopSuppliesFee] = useState(
    order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? 0 : order.shopSuppliesFee || 0
  );
  const [wasteFee, setWasteFee] = useState(
    order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? 0 : isValidNumber(order.wasteFee) ? order.wasteFee : 50
  );
  const [discount, setDiscount] = useState(order.discount || 0);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [editedServiceNames, setEditedServiceNames] = useState({});
  const [editedPartMemos, setEditedPartMemos] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [laborRate, setLaborRate] = useState(
    order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? 100 : (order.laborRate || 150)
  );
  const [shopSuppliesRate, setShopSuppliesRate] = useState(
    order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? 0 : isValidNumber(order.shopSuppliesRate) ? order.shopSuppliesRate : 0.03
  );
  
  const DEFAULT_MARGIN = 25; // 25% default margin
  const TAX_RATE = order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? 0 : 0.06; 

  // Initialize selections and margins when order data changes
  useEffect(() => {
    if (order.services) {
      const selectedIds = order.selectedServiceIds || order.services.map(s => s.id);
      setSelectedServices(order.services.filter(s => selectedIds.includes(s.id)));
    }
    
    if (order.expenses) {
      const selectedIds = order.selectedPartIds || order.expenses.map(p => p.id);
      setSelectedParts(order.expenses.filter(p => selectedIds.includes(p.id)));
      
      const initialMargins = {};
      order.expenses.forEach(part => {
        if (part.margin === null || part.margin === undefined || part.margin === '') {
          part.margin = DEFAULT_MARGIN
        }
        initialMargins[part.id] = part.margin;
      });
      setPartMargins(initialMargins);

      // Set default fees only if they're currently blank
      if (shopSuppliesFee === null || shopSuppliesFee === undefined || shopSuppliesFee === '') {
        const initialSubtotal = calculateInitialSubtotal(order.services, order.expenses, initialMargins);
        setShopSuppliesFee(initialSubtotal * shopSuppliesRate);
      }
      if (wasteFee === null || wasteFee === undefined || wasteFee === '') {
        setWasteFee(50);
      }
    }
  }, [order]);

  // Add new useEffect to calculate totals after state updates
  useEffect(() => {
    calculateTotals();
  }, [selectedServices, selectedParts, partMargins, shopSuppliesFee, wasteFee, discount, taxEnabled]);

  // Add useEffect to update totals when rates change
  useEffect(() => {
    calculateTotals();
  }, [selectedServices, selectedParts, partMargins, shopSuppliesFee, wasteFee, discount, taxEnabled, laborRate, shopSuppliesRate]);

  const handleMarginChange = async (partId, newValue) => {
    const newMargins = {
      ...partMargins,
      [partId]: newValue // Store the raw value, even if empty
    };
    setPartMargins(newMargins);
    
    // Check if any margins are invalid
    const hasInvalidMargins = order.expenses?.some(part => {
      const margin = newMargins[part.id];
      return margin === null || margin === undefined || margin === '';
    });
    setInvalidMargins(hasInvalidMargins);

    const numericValue = Number(newValue);
    console.log(partId, numericValue);
    // Only proceed if it's a valid number (including zero)
    if (numericValue >= 0) {
      try {
        // Update Firebase record
        await db.doc(`purchases/${partId}`).update({ margin: numericValue });
        
        // Update order object
        const updatedExpenses = order.expenses.map(expense => 
          expense.id === partId ? { ...expense, margin: numericValue } : expense
        );
        StateManager.updateOrder({ expenses: updatedExpenses });
      } catch (error) {
        console.error('Error updating margin:', error);
        setSnackbar({
          open: true,
          message: `Failed to update margin: ${error.message}`,
          severity: 'error'
        });
      }
    }

    // Recalculate totals with new margins
    calculateTotals();
  };

  const calculatePartPrice = (part) => {
    const cost = part.amount || 0;
    const margin = partMargins[part.id];
    
    if (margin === null || margin === undefined || margin === '') {
      return 0;
    }
    
    return cost * (1 + margin / 100);
  };

  const calculateAdjustedSubtotal = () => {
    return subtotal + shopSuppliesFee + wasteFee - discount;
  };

  const calculateTotalPayments = () => {
    return (order.deposits || [])
      .filter(deposit => deposit.type === 'service')
      .reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
  };

  const calculateInitialSubtotal = (services, expenses, margins) => {
    const servicesTotal = services?.reduce((sum, service) => {
      const hours = service.time || 1;
      return sum + (hours * laborRate);
    }, 0) || 0;
    
    const partsTotal = expenses?.reduce((sum, part) => {
      const margin = margins[part.id] || DEFAULT_MARGIN;
      const markupMultiplier = 1 + (margin / 100);
      return sum + (part.amount * markupMultiplier);
    }, 0) || 0;
    
    return servicesTotal + partsTotal;
  };

  const calculateTotals = () => {
    const servicesTotal = selectedServices?.reduce((sum, service) => {
      const hours = service.time || 1;
      return sum + (hours * laborRate);
    }, 0) || 0;
    
    const partsTotal = selectedParts.reduce((sum, part) => {
      const margin = isValidNumber(partMargins[part.id]) ? partMargins[part.id] : DEFAULT_MARGIN;
      const markupMultiplier = 1 + (margin / 100);
      return sum + (part.amount * markupMultiplier);
    }, 0) || 0;
    
    const newSubtotal = servicesTotal + partsTotal;
    const newShopSuppliesFee = newSubtotal * shopSuppliesRate;
    const adjustedSubtotal = newSubtotal + newShopSuppliesFee + wasteFee - discount;
    
    // Only apply tax if there are parts selected
    const shouldApplyTax = selectedParts.length > 0;
    const newTax = (taxEnabled && shouldApplyTax) ? adjustedSubtotal * TAX_RATE : 0;
    
    setSubtotal(newSubtotal);
    setShopSuppliesFee(newShopSuppliesFee);
    setTax(newTax);
    setTotal(adjustedSubtotal + newTax);
  };

  const handleServiceToggle = async (service) => {
    try {
      const isSelected = selectedServices.some(s => s.id === service.id);
      const newServices = isSelected 
        ? selectedServices.filter(s => s.id !== service.id)
        : [...selectedServices, service];

      // Update local state
      setSelectedServices(newServices);

      // Update Firebase
      const serviceIds = newServices.map(s => s.id);
      await db.doc(`orders/${order.stock}`).update({ 
        selectedServiceIds: serviceIds 
      });
      
      // Update order in state manager
      StateManager.updateOrder({ selectedServiceIds: serviceIds });

      // Calculate totals...
      const servicesTotal = newServices.reduce((sum, s) => {
        const hours = s.time || 0;
        return sum + (hours * laborRate);
      }, 0);
      
      const partsTotal = selectedParts.reduce((sum, part) => {
        const margin = isValidNumber(partMargins[part.id]) ? partMargins[part.id] : DEFAULT_MARGIN;
        const markupMultiplier = 1 + (margin / 100);
        return sum + (part.amount * markupMultiplier);
      }, 0) || 0;
      
      const newSubtotal = servicesTotal + partsTotal;
      const adjustedSubtotal = newSubtotal + shopSuppliesFee + wasteFee - discount;
      const newTax = taxEnabled ? adjustedSubtotal * TAX_RATE : 0;
      
      setSubtotal(newSubtotal);
      setTax(newTax);
      setTotal(adjustedSubtotal + newTax);
      
    } catch (error) {
      console.error('Error updating selected services:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update service selection: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handlePartToggle = async (part) => {
    try {
      const isSelected = selectedParts.some(p => p.id === part.id);
      const newParts = isSelected 
        ? selectedParts.filter(p => p.id !== part.id)
        : [...selectedParts, part];

      // Update local state
      setSelectedParts(newParts);

      // Update Firebase
      const partIds = newParts.map(p => p.id);
      await db.doc(`orders/${order.stock}`).update({ 
        selectedPartIds: partIds 
      });
      
      // Update order in state manager
      StateManager.updateOrder({ selectedPartIds: partIds });

      // Calculate totals...
      const servicesTotal = selectedServices.reduce((sum, service) => {
        const hours = service.time || 1;
        return sum + (hours * laborRate);
      }, 0);
      
      const partsTotal = newParts.reduce((sum, part) => {
        const margin = isValidNumber(partMargins[part.id]) ? partMargins[part.id] : DEFAULT_MARGIN;
        const markupMultiplier = 1 + (margin / 100);
        return sum + (part.amount * markupMultiplier);
      }, 0) || 0;
      
      const newSubtotal = servicesTotal + partsTotal;
      const adjustedSubtotal = newSubtotal + shopSuppliesFee + wasteFee - discount;
      const newTax = taxEnabled ? adjustedSubtotal * TAX_RATE : 0;
      
      setSubtotal(newSubtotal);
      setTax(newTax);
      setTotal(adjustedSubtotal + newTax);
      
    } catch (error) {
      console.error('Error updating selected parts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update part selection: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Add this helper function for input formatting
  const formatInputValue = (value) => {
    // Remove leading zeros and return empty string if 0
    if (value === 0) return '';
    return value.toString();
  };

  const handleFieldEdit = async (type, id, newValue) => {
    const config = {
      service: {
        collection: 'services',
        field: 'name',
        orderField: 'services',
        setState: setEditedServiceNames,
        displayName: 'service description'
      },
      part: {
        collection: 'purchases',
        field: 'memo',
        orderField: 'expenses',
        setState: setEditedPartMemos,
        displayName: 'part description'
      }
    };

    const { collection, field, orderField, setState, displayName } = config[type];

    // Update local state
    setState(prev => ({
      ...prev,
      [id]: newValue
    }));

    try {
      // Update Firebase record using db
      await db.doc(`${collection}/${id}`).update({ [field]: newValue });
      
      // Update order object
      const updatedItems = order[orderField].map(item => 
        item.id === id ? { ...item, [field]: newValue } : item
      );
      StateManager.updateOrder({[orderField]: updatedItems});

    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to update ${displayName}: ${error.message}`,
        severity: 'error'
      });
      
      setState(prev => ({
        ...prev,
        [id]: order[orderField].find(item => item.id === id)?.[field]
      }));
    }
  };

  // Simplified handlers that use the shared function
  const handleServiceNameEdit = (serviceId, newName) => {
    handleFieldEdit('service', serviceId, newName);
  };

  const handlePartMemoEdit = (partId, newMemo) => {
    handleFieldEdit('part', partId, newMemo);
  };

  const handleKeyDown = (e, resetFunction) => {
    if (e.key === 'Escape') {
      resetFunction();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDiscountChange = async (value) => {
    try {
      const numericValue = value === '' ? 0 : Number(value);
      setDiscount(numericValue);
      await db.doc(`orders/${order.stock}`).update({ discount: numericValue });
      StateManager.updateOrder({ discount: numericValue });
    } catch (error) {
      console.error('Error updating discount:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update discount: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Add this function to calculate service and parts totals separately
  const calculateServiceTotal = () => {
    return selectedServices?.reduce((sum, service) => {
      const hours = service.time || 1;
      return sum + (hours * laborRate);
    }, 0) || 0;
  };

  const calculatePartsTotal = () => {
    return selectedParts.reduce((sum, part) => {
      const margin = isValidNumber(partMargins[part.id]) ? partMargins[part.id] : DEFAULT_MARGIN;
      const markupMultiplier = 1 + (margin / 100);
      return sum + (part.amount * markupMultiplier);
    }, 0) || 0;
  };

  // Add this function to handle invoice generation
  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    
    try {
      const serviceTotal = calculateServiceTotal();
      const partsTotal = calculatePartsTotal();

      // Format parts data
      const partsData = selectedParts.map((part, index) => {
        const margin = isValidNumber(partMargins[part.id]) ? partMargins[part.id] : DEFAULT_MARGIN;
        const markupMultiplier = 1 + (margin / 100);
        const charge = part.amount * markupMultiplier;
        
        return {
          item: `item ${index + 1}`,
          description: part.memo,
          charge: charge
        };
      });

      // Format labor data
      const laborData = selectedServices.map((service, index) => {
        const hours = service.time || 1;
        return {
          item: `item ${index + 1}`,
          description: service.name,
          charge: hours * laborRate
        };
      });

      // Format customer data
      const customerData = {
        name: (order.customer.first_name || "") + (order.customer.first_name ? " " : "")+ (order.customer.last_name || ""),
        address: order.customer.address1,
        cityState: (order.customer.city && order.customer.state) ? `${order.customer.city}, ${order.customer.state}` : false,
        phone: order.customer.phone_number,
        email: order.customer.email
      };

      // Format vehicle data
      const vehicleData = {
        model: order.car.year + ' ' + order.car.make + ' ' + order.car.model,
        vin: order.car.vin,
        miles: order.car.miles || 'EXEMPT',
        license: order.car.license || ''
      };

      const invoiceData = {
        stock: order.stock,
        date: new Date().toLocaleDateString(),
        customer: customerData,
        vehicle: vehicleData,
        parts: partsData,
        labor: laborData,
        serviceTotal: serviceTotal,
        partsTotal: partsTotal,
        subtotal: subtotal,
        discount: discount,
        taxRate: taxEnabled ? TAX_RATE * 100 : 0,
        shopSupplies: Number(shopSuppliesFee.toFixed(2)),
        wasteFee: Number(wasteFee.toFixed(2)),
        payments: calculateTotalPayments()
      };

      const response = await RequestManager.post({
        function: 'generateServiceInvoice',
        variables: invoiceData
      });

      if (response.url) {
        window.open(response.url, '_blank');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to generate invoice',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      setSnackbar({
        open: true,
        message: 'Error generating invoice: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Update handleRateChange to use the correct collection path
  const handleRateChange = async (field, value, defaultValue) => {
    // Only save if the value is different from the default
    try {
      await db.doc(`orders/${order.stock}`).update({ [field]: value });
      StateManager.updateOrder({ [field]: value });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to update ${field}: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const renderInvoiceSettings = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Invoice Settings</Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        mb: 2 
      }}>
        {/* Labor Rate */}
        <TextField
          label="Labor Rate"
          type="number"
          value={formatInputValue(laborRate)}
          onChange={(e) => {
            if (order.customer.id !== "9c0d88f5-84f9-454d-833d-a8ced9adad49") {
              const newValue = e.target.value === '' ? 0 : Number(e.target.value);
              setLaborRate(newValue);
              handleRateChange('laborRate', newValue, 150);
            }
          }}
          disabled={order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49"}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          size="small"
          fullWidth
          helperText={order.customer.id === "9c0d88f5-84f9-454d-833d-a8ced9adad49" ? "Rate locked for this customer" : ""}
        />

        {/* Shop Supplies */}
        <TextField
          label="Shop Supplies Rate"
          type="number"
          value={formatInputValue(shopSuppliesRate * 100)}
          onChange={(e) => {
            const newValue = e.target.value === '' ? 0 : Number(e.target.value) / 100;
            setShopSuppliesRate(newValue);
            handleRateChange('shopSuppliesRate', newValue, 0.03);
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          size="small"
          fullWidth
          helperText="Percentage of subtotal"
        />

        {/* Waste Fee */}
        <TextField
          label="Waste Fee"
          type="number"
          value={formatInputValue(wasteFee)}
          onChange={(e) => {
            const newValue = e.target.value === '' ? 0 : Number(e.target.value);
            setWasteFee(newValue);
            handleRateChange('wasteFee', newValue, 50);
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          size="small"
          fullWidth
          helperText="Fixed amount"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={taxEnabled}
              onChange={(e) => {
                setTaxEnabled(e.target.checked);
                handleRateChange('taxEnabled', e.target.checked, true);
              }}
            />
          }
          label="Enable Tax"
        />
        <Typography variant="body2" color="text.secondary">
          {selectedParts.length === 0 ? "(Tax only applies when parts are included)" : ""}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Invoice for Order #{order.stock}
      </Typography>
      
      {/* Customer Information */}
      <Typography variant="h6" gutterBottom>
        Customer: {order.customer?.display_name || 'N/A'}
      </Typography>

      {/* Add Invoice Settings section here */}
      {renderInvoiceSettings()}

      {/* Remove the old labor rate display since it's now in settings */}
      
      {/* Services Section with updated property name */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ p: 1 }}>Services</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">Include</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.services?.map((service) => (
              <TableRow key={service.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedServices.some(s => s.id === service.id)}
                    onChange={() => handleServiceToggle(service)}
                  />
                </TableCell>
                <TableCell>
                  {editingServiceId === service.id ? (
                    <TextField
                      fullWidth
                      value={editedServiceNames[service.id] || service.name}
                      onChange={(e) => handleServiceNameEdit(service.id, e.target.value)}
                      onBlur={() => setEditingServiceId(null)}
                      onKeyDown={(e) => handleKeyDown(e, () => setEditingServiceId(null))}
                      error={!editedServiceNames[service.id] && !service.name}
                      helperText={(!editedServiceNames[service.id] && !service.name) ? "Description cannot be empty" : ""}
                      autoFocus
                    />
                  ) : (
                    <Box
                      onClick={() => {
                        setEditingServiceId(service.id);
                        if (!editedServiceNames[service.id]) {
                          handleServiceNameEdit(service.id, service.name);
                        }
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 1 }}
                    >
                      {editedServiceNames[service.id] || service.name}
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">{service.time || 1}</TableCell>
                <TableCell align="right">${laborRate.toFixed(2)}</TableCell>
                <TableCell align="right">
                  ${((service.time || 1) * laborRate).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Updated Parts Section */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ p: 1 }}>Parts</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">Include</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Margin %</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.expenses?.map((part) => {
              const cost = part.amount || 0;
              const price = calculatePartPrice(part);
              const quantity = part.quantity || 1;
              const margin = partMargins[part.id];
              const isInvalidMargin = margin === null || margin === undefined || margin === '';

              return (
                <TableRow key={part.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedParts.some(p => p.id === part.id)}
                      onChange={() => handlePartToggle(part)}
                    />
                  </TableCell>
                  <TableCell>
                    {editingPartId === part.id ? (
                      <TextField
                        fullWidth
                        value={editedPartMemos[part.id] || part.memo}
                        onChange={(e) => handlePartMemoEdit(part.id, e.target.value)}
                        onBlur={() => setEditingPartId(null)}
                        onKeyDown={(e) => handleKeyDown(e, () => setEditingPartId(null))}
                        error={!editedPartMemos[part.id] && !part.memo}
                        helperText={(!editedPartMemos[part.id] && !part.memo) ? "Description cannot be empty" : ""}
                        autoFocus
                      />
                    ) : (
                      <Box
                        onClick={() => {
                          setEditingPartId(part.id);
                          if (!editedPartMemos[part.id]) {
                            handlePartMemoEdit(part.id, part.memo);
                          }
                        }}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 1 }}
                      >
                        {editedPartMemos[part.id] || part.memo}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">{quantity}</TableCell>
                  <TableCell align="right">${cost.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={partMargins[part.id] || ''} // Use empty string when no value
                      onChange={(e) => handleMarginChange(part.id, e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      size="small"
                      sx={{ 
                        width: '100px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: (partMargins[part.id] === null || 
                                         partMargins[part.id] === undefined || 
                                         partMargins[part.id] === '') ? 'error.main' : 'inherit',
                          },
                        },
                      }}
                      error={partMargins[part.id] === null || 
                             partMargins[part.id] === undefined || 
                             partMargins[part.id] === ''}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${(price * quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals Section */}
      <Paper sx={{ p: 2, maxWidth: '400px', ml: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Service and Parts Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="body1">Service Total:</Typography>
            <Typography variant="body1">${calculateServiceTotal().toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="body1">Parts Total:</Typography>
            <Typography variant="body1">${calculatePartsTotal().toFixed(2)}</Typography>
          </Box>

          {/* Base Charges */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid #eee', 
            borderTop: '1px solid #000',
            pt: 1,
            pb: 1 
          }}>
            <Typography variant="body1">Subtotal:</Typography>
            <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
          </Box>

          {/* Fees */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1">Shop Supplies Fee:</Typography>
            <Typography variant="body1">${shopSuppliesFee.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="body1">Waste Fee:</Typography>
            <Typography variant="body1">${wasteFee.toFixed(2)}</Typography>
          </Box>

          {/* Discount */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">Discount:</Typography>
            <TextField
              type="number"
              value={formatInputValue(discount)}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="0"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              size="small"
              sx={{ 
                width: '120px',
                '& input': { textAlign: 'right' }
              }}
            />
          </Box>

          {/* Adjusted Subtotal */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            borderTop: '1px solid #000',
            py: 1,
            my: 1,
            fontWeight: 'bold'
          }}>
            <Typography variant="body1" fontWeight="bold">Adjusted Subtotal:</Typography>
            <Typography variant="body1" fontWeight="bold">${calculateAdjustedSubtotal().toFixed(2)}</Typography>
          </Box>

          {/* Tax Information */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1">Tax Rate:</Typography>
            <Typography variant="body1">{(TAX_RATE * 100).toFixed(1)}%</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            pb: 1
          }}>
            <Typography variant="body1">Total Tax:</Typography>
            <Typography variant="body1">${tax.toFixed(2)}</Typography>
          </Box>

          {/* Payments */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1">Payments:</Typography>
            <Typography variant="body1" color="error">-${calculateTotalPayments().toFixed(2)}</Typography>
          </Box>

          {/* Final Balance */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            borderTop: '2px solid #000',
            mt: 2,
            pt: 2
          }}>
            <Typography variant="h6" fontWeight="bold">Balance Due:</Typography>
            <Typography variant="h6" fontWeight="bold">${(total - calculateTotalPayments()).toFixed(2)}</Typography>
          </Box>
        </Box>
      </Paper>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleGenerateInvoice}
        disabled={invalidMargins || isGeneratingInvoice}
        startIcon={isGeneratingInvoice ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
      </Button>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}



const isValidNumber = (value) => {
  return !(value === null || value === undefined || value === '');
}

