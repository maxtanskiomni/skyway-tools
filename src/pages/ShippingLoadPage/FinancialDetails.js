import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ClearIcon from '@mui/icons-material/Clear';
import { StateManager } from '../../utilities/stateManager';
import firebase from '../../utilities/firebase';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import moment from 'moment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const FinancialDetails = ({ loadData, onUpdateField }) => {
  const [deposits, setDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [newDeposit, setNewDeposit] = useState({ 
    amount: '', 
    date: new Date(), 
    memo: '', 
    account: '',
    postAsCarCost: false,
    carCostStock: ''
  });
  const [editingMemoId, setEditingMemoId] = useState(null);
  const [editingMemoValue, setEditingMemoValue] = useState('');
  const [driverPaid, setDriverPaid] = useState(false);

  // Dialog state for Add Deposit
  const [addDepositOpen, setAddDepositOpen] = useState(false);

  // Purchases/Costs state
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ amount: '', date: new Date(), memo: '', vendor: '', isPaid: false, paidDate: null });
  const [editingPurchaseMemoId, setEditingPurchaseMemoId] = useState(null);
  const [editingPurchaseMemoValue, setEditingPurchaseMemoValue] = useState('');

  // Calculate total revenue from all stops
  const totalRevenue = useMemo(() => {
    if (!loadData?.cars) return 0;
    return loadData.cars.reduce((sum, car) => sum + (parseFloat(car.charge) || 0), 0);
  }, [loadData?.cars]);

  // Calculate total cost based on distance
  const driverCost = useMemo(() => {
    if (!loadData?.total_miles || !loadData?.cost_per_mile) return 0;
    return loadData.total_miles * loadData.cost_per_mile;
  }, [loadData?.total_miles, loadData?.cost_per_mile]);

  // Calculate total additional costs from purchases
  const additionalCosts = useMemo(() => {
    return purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.amount) || 0), 0);
  }, [purchases]);

  // Calculate total costs (driver + additional)
  const totalCost = useMemo(() => {
    return driverCost + additionalCosts;
  }, [driverCost, additionalCosts]);

  // Calculate profit/loss
  const profitLoss = useMemo(() => {
    return totalRevenue - totalCost;
  }, [totalRevenue, totalCost]);

  // Calculate total deposits
  const totalDeposits = useMemo(() => {
    return deposits.reduce((sum, deposit) => sum + (parseFloat(deposit.amount) || 0), 0);
  }, [deposits]);

  // Calculate remaining balance
  const remainingBalance = useMemo(() => {
    return totalRevenue - totalDeposits;
  }, [totalRevenue, totalDeposits]);

  // Add function to handle driver paid status update
  const handleDriverPaidChange = async (event) => {
    const newStatus = event.target.checked;
    try {
      const loadId = String(loadData.id || loadData.loadId || loadData.stock);
      await firebase.firestore()
        .collection('shipping-loads')
        .doc(loadId)
        .update({ driver_paid: newStatus });
      setDriverPaid(newStatus);
      StateManager.setAlertAndOpen("Driver payment status updated", "success");
    } catch (error) {
      StateManager.setAlertAndOpen("Error updating driver payment status: " + error.message, "error");
    }
  };

  // Modify handleAddDeposit to handle both deposit and car cost
  const handleAddDeposit = async () => {
    if (!newDeposit.amount || isNaN(parseFloat(newDeposit.amount))) {
      StateManager.setAlertAndOpen("Please enter a valid deposit amount", "error");
      return;
    }

    if (newDeposit.postAsCarCost && !newDeposit.carCostStock) {
      StateManager.setAlertAndOpen("Please enter a stock number for the car cost", "error");
      return;
    }

    try {
      // Create the deposit
      const deposit = {
        amount: parseFloat(newDeposit.amount),
        date: moment(newDeposit.date).format('YYYY/MM/DD'),
        memo: newDeposit.memo,
        account: newDeposit.account,
        stock: String(loadData.id || loadData.loadId || loadData.stock),
        type: 'shipping',
      };
      await firebase.firestore().collection('deposits').add(deposit);

      // If postAsCarCost is checked, create the car cost purchase
      if (newDeposit.postAsCarCost) {
        const purchaseId = `${newDeposit.carCostStock.trim()}-${loadData.id}`; //Unique ID to car load combination
        const carCost = {
          amount: parseFloat(newDeposit.amount),
          date: moment(newDeposit.date).format('YYYY/MM/DD'),
          memo: `TFD - Transfer to shipping on LN${loadData.id}`,
          vendor: 'Skyway Classics',
          isPayable: false,
          paidDate: moment().format('YYYY/MM/DD'),
          stock: newDeposit.carCostStock.trim(),
        };
        await firebase.firestore().collection('purchases').doc(purchaseId).set(carCost);
      }

      // Reset form
      setNewDeposit({ 
        amount: '', 
        date: new Date(), 
        memo: '', 
        account: '',
        postAsCarCost: false,
        carCostStock: ''
      });
      setAddDepositOpen(false);
      StateManager.setAlertAndOpen("Deposit added successfully", "success");
    } catch (error) {
      StateManager.setAlertAndOpen("Error adding deposit: " + error.message, "error");
    }
  };

  // Remove deposit from Firestore
  const handleRemoveDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to remove this deposit?')) {
      return;
    }
    await firebase.firestore().collection('deposits').doc(depositId).delete();
  };

  // Save edited memo to Firestore
  const handleSaveMemo = async (depositId) => {
    await firebase.firestore().collection('deposits').doc(depositId).update({ memo: editingMemoValue });
    setEditingMemoId(null);
  };

  // Add purchase to Firestore
  const handleAddPurchase = async () => {
    if (!newPurchase.amount || isNaN(parseFloat(newPurchase.amount))) {
      StateManager.setAlertAndOpen("Please enter a valid purchase amount", "error");
      return;
    }
    const purchase = {
      amount: parseFloat(newPurchase.amount),
      date: moment(newPurchase.date).format('YYYY/MM/DD'),
      memo: newPurchase.memo,
      vendor: newPurchase.vendor,
      type: 'shipping',
      isPayable: !newPurchase.isPaid,
      paidDate: newPurchase.isPaid && newPurchase.paidDate ? moment(newPurchase.paidDate).format('YYYY/MM/DD') : null,
      stock: String(loadData.id || loadData.loadId || loadData.stock),
    };
    await firebase.firestore().collection('purchases').add(purchase);
    setNewPurchase({ amount: '', date: new Date(), memo: '', vendor: '', isPaid: false, paidDate: null });
    setAddPurchaseOpen(false);
  };

  // Remove purchase from Firestore
  const handleRemovePurchase = async (purchaseId) => {
    if (!window.confirm('Are you sure you want to remove this purchase?')) {
      return;
    }
    await firebase.firestore().collection('purchases').doc(purchaseId).delete();
  };

  // Save edited purchase memo to Firestore
  const handleSavePurchaseMemo = async (purchaseId) => {
    await firebase.firestore().collection('purchases').doc(purchaseId).update({ memo: editingPurchaseMemoValue });
    setEditingPurchaseMemoId(null);
  };

  // Add function to update deposit_complete status after all useMemo declarations
  const updateDepositCompleteStatus = async () => {
    if (!loadData?.id && !loadData?.loadId && !loadData?.stock) return;
    
    const loadId = String(loadData.id || loadData.loadId || loadData.stock);
    const currentTotalRevenue = loadData?.cars ? loadData.cars.reduce((sum, car) => sum + (parseFloat(car.charge) || 0), 0) : 0;
    console.log(totalDeposits, currentTotalRevenue);
    const isComplete = totalDeposits >= currentTotalRevenue;
    
    try {
      await firebase.firestore()
        .collection('shipping-loads')
        .doc(loadId)
        .update({ deposit_complete: isComplete });
    } catch (error) {
      console.error("Error updating deposit complete status:", error);
    }
  };

  // Update useEffect for deposits
  useEffect(() => {
    if (!loadData?.id && !loadData?.loadId && !loadData?.stock) return;
    setLoadingDeposits(true);
    const loadId = String(loadData.id || loadData.loadId || loadData.stock);
    const unsubscribe = firebase.firestore()
      .collection('deposits')
      .where('stock', '==', loadId)
      .onSnapshot(snapshot => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by date in descending order
        const sorted = fetched.sort((a, b) => moment(b.date, 'YYYY/MM/DD').valueOf() - moment(a.date, 'YYYY/MM/DD').valueOf());
        setDeposits(sorted);
        setLoadingDeposits(false);
      });
    return () => unsubscribe();
  }, [loadData]); // Remove totalRevenue dependency

  // Add useEffect to update deposit_complete status when deposits or revenue changes
  useEffect(() => {
    if (!loadingDeposits && (loadData?.id || loadData?.loadId || loadData?.stock)) {
      updateDepositCompleteStatus();
    }
  }, [totalDeposits, totalRevenue, loadingDeposits]); // Depend on the memoized values and loading state

  // Add useEffect to check deposit_complete status on initial load
  useEffect(() => {
    if (!loadingDeposits && (loadData?.id || loadData?.loadId || loadData?.stock)) {
      updateDepositCompleteStatus();
    }
  }, [loadData?.id, loadData?.loadId, loadData?.stock, loadingDeposits]); // Use direct dependencies and loading state

  // Fetch purchases from Firestore for this load
  useEffect(() => {
    if (!loadData?.id && !loadData?.loadId && !loadData?.stock) return;
    setLoadingPurchases(true);
    const loadId = String(loadData.id || loadData.loadId || loadData.stock);
    const unsubscribe = firebase.firestore()
      .collection('purchases')
      .where('stock', '==', loadId)
      .onSnapshot(snapshot => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by date in descending order
        const sorted = fetched.sort((a, b) => moment(b.date, 'YYYY/MM/DD').valueOf() - moment(a.date, 'YYYY/MM/DD').valueOf());
        setPurchases(sorted);
        setLoadingPurchases(false);
      });
    return () => unsubscribe();
  }, [loadData]);

  // Add useEffect to fetch initial driver_paid status
  useEffect(() => {
    if (loadData?.id || loadData?.loadId || loadData?.stock) {
      const loadId = String(loadData.id || loadData.loadId || loadData.stock);
      firebase.firestore()
        .collection('shipping-loads')
        .doc(loadId)
        .onSnapshot(doc => {
          if (doc.exists) {
            setDriverPaid(doc.data().driver_paid || false);
          }
        });
    }
  }, [loadData]);

  // Add useEffect to update deposit_complete status when component mounts
  useEffect(() => {
    if (loadData?.id || loadData?.loadId || loadData?.stock) {
      updateDepositCompleteStatus();
    }
  }, []); // Empty dependency array means this runs once when component mounts

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Profit and Loss
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Revenue and Cost Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
              Profit & Loss Statement
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {/* Revenue Section */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ bgcolor: 'background.paper', pt: 2 }}>
                      <Typography variant="subtitle2">Revenue</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Total Revenue (from charges)</TableCell>
                    <TableCell align="right">${totalRevenue.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Costs Section */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ bgcolor: 'background.paper', pt: 2 }}>
                      <Typography variant="subtitle2">Cost of Services</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Driver Costs (${loadData?.cost_per_mile || 0}/mile × {loadData?.total_miles || 0} miles)</TableCell>
                    <TableCell align="right">${driverCost.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={driverPaid}
                            onChange={handleDriverPaidChange}
                            color="primary"
                          />
                        }
                        label="Driver Paid"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={driverPaid ? "Paid" : "Unpaid"}
                        size="small"
                        color={driverPaid ? "success" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ pl: 4 }}>Additional Costs (from purchases)</TableCell>
                    <TableCell align="right">${additionalCosts.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Blank line */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ height: '24px' }}></TableCell>
                  </TableRow>

                  {/* Gross Income Line */}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Gross Income</TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: profitLoss >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      ${profitLoss.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Deposit Tracking */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle1" gutterBottom>Deposit Tracking</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Memo</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingDeposits ? (
                    <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                  ) : (
                    deposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell>{deposit.date ? new Date(deposit.date).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{deposit.account || ''}</TableCell>
                        <TableCell>
                          {editingMemoId === deposit.id ? (
                            <TextField
                              value={editingMemoValue}
                              onChange={e => setEditingMemoValue(e.target.value)}
                              size="small"
                              onBlur={() => setEditingMemoId(null)}
                              autoFocus
                            />
                          ) : (
                            deposit.memo
                          )}
                        </TableCell>
                        <TableCell>${Number(deposit.amount).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {editingMemoId === deposit.id ? (
                            <Button
                              onClick={() => handleSaveMemo(deposit.id)}
                              size="small"
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setEditingMemoId(deposit.id);
                                setEditingMemoValue(deposit.memo || '');
                              }}
                              size="small"
                            >
                              Edit
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveDeposit(deposit.id)}
                          >
                            <ClearIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Blank line */}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ height: '24px' }}></TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={4}><strong>Total Deposits</strong></TableCell>
                    <TableCell colSpan={4} align="right">
                      <Typography 
                        color={totalDeposits >= totalRevenue ? 'success.main' : 'text.primary'}
                        sx={{ 
                          fontWeight: 'bold',
                          color: totalDeposits >= totalRevenue ? 'success.main' : '#E65100'
                        }}
                      >
                        ${totalDeposits.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4}><strong>Remaining Balance</strong></TableCell>
                    <TableCell colSpan={4} align="right">
                      <Typography 
                        sx={{ 
                          fontWeight: 'bold',
                          color: remainingBalance <= 0 ? 'success.main' : '#E65100'
                        }}
                      >
                        ${remainingBalance.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<AttachMoneyIcon />}
                onClick={() => setAddDepositOpen(true)}
              >
                Add Deposit
              </Button>
            </Box>
            <Dialog open={addDepositOpen} onClose={() => setAddDepositOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ pb: 0 }}>Add Deposit</DialogTitle>
              <DialogContent sx={{ pt: 1, pb: 2 }}>
                <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Enter deposit details below:</Typography>
                  <Grid container spacing={2} direction="column">
                    <Grid item>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        type="number"
                        value={newDeposit.amount}
                        onChange={(e) => setNewDeposit(prev => ({ ...prev, amount: e.target.value }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Date"
                          value={newDeposit.date}
                          onChange={(date) => setNewDeposit(prev => ({ ...prev, date }))}
                          renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item>
                      <Select
                        fullWidth
                        size="small"
                        value={newDeposit.account}
                        onChange={e => setNewDeposit(prev => ({ ...prev, account: e.target.value }))}
                        displayEmpty
                        renderValue={selected => selected || 'Select Account'}
                      >
                        <MenuItem value="" disabled>Select Account</MenuItem>
                        {StateManager.deposit_banks.map((bank) => (
                          <MenuItem key={bank.value} value={bank.value}>{bank.label}</MenuItem>
                        ))}
                      </Select>
                    </Grid>
                    <Grid item>
                      <TextField
                        fullWidth
                        size="small"
                        label="Memo"
                        value={newDeposit.memo}
                        onChange={(e) => setNewDeposit(prev => ({ ...prev, memo: e.target.value }))}
                      />
                    </Grid>
                    <Grid item>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={newDeposit.postAsCarCost}
                            onChange={(e) => setNewDeposit(prev => ({ 
                              ...prev, 
                              postAsCarCost: e.target.checked,
                              carCostStock: e.target.checked ? prev.carCostStock : ''
                            }))}
                            color="primary"
                          />
                        }
                        label="Post as Car Cost"
                      />
                    </Grid>
                    {newDeposit.postAsCarCost && (
                      <Grid item>
                        <TextField
                          fullWidth
                          size="small"
                          label="Stock Number"
                          value={newDeposit.carCostStock}
                          onChange={(e) => setNewDeposit(prev => ({ ...prev, carCostStock: e.target.value }))}
                          required
                          helperText="Enter the stock number for this car cost"
                        />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </DialogContent>
              <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={() => setAddDepositOpen(false)}>Cancel</Button>
                <Button 
                  variant="contained" 
                  onClick={handleAddDeposit}
                  disabled={!newDeposit.amount || (newDeposit.postAsCarCost && !newDeposit.carCostStock)}
                >
                  Add Deposit
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>
        {/* Additional Purchases/Costs Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.default', mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Additional Purchases / Costs</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Memo</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Paid Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingPurchases ? (
                    <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.date || ''}</TableCell>
                        <TableCell>{purchase.vendor || ''}</TableCell>
                        <TableCell>
                          {editingPurchaseMemoId === purchase.id ? (
                            <TextField
                              value={editingPurchaseMemoValue}
                              onChange={e => setEditingPurchaseMemoValue(e.target.value)}
                              size="small"
                              onBlur={() => setEditingPurchaseMemoId(null)}
                              autoFocus
                            />
                          ) : (
                            <>
                              {purchase.memo}
                              {typeof purchase.isPayable === 'boolean' && (
                                <Chip
                                  label={purchase.isPayable === false ? 'Paid' : 'Unpaid'}
                                  size="small"
                                  color={purchase.isPayable === false ? 'success' : 'default'}
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell>${Number(purchase.amount).toFixed(2)}</TableCell>
                        <TableCell>{purchase.paidDate ? (typeof purchase.paidDate === 'string' ? purchase.paidDate : moment(purchase.paidDate).format('YYYY/MM/DD')) : ''}</TableCell>
                        <TableCell align="right">
                          {editingPurchaseMemoId === purchase.id ? (
                            <Button
                              onClick={() => handleSavePurchaseMemo(purchase.id)}
                              size="small"
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setEditingPurchaseMemoId(purchase.id);
                                setEditingPurchaseMemoValue(purchase.memo || '');
                              }}
                              size="small"
                            >
                              Edit
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePurchase(purchase.id)}
                          >
                            <ClearIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setAddPurchaseOpen(true)}
              >
                Add Purchase/Cost
              </Button>
            </Box>
            <Dialog open={addPurchaseOpen} onClose={() => setAddPurchaseOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle sx={{ pb: 0 }}>Add Purchase / Cost</DialogTitle>
              <DialogContent sx={{ pt: 1, pb: 2 }}>
                <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Enter purchase/cost details below:</Typography>
                  <Grid container spacing={2} direction="column">
                    <Grid item>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Date"
                          value={newPurchase.date}
                          onChange={(date) => setNewPurchase(prev => ({ ...prev, date }))}
                          renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item>
                      <TextField
                        fullWidth
                        size="small"
                        label="Vendor"
                        value={newPurchase.vendor}
                        onChange={e => setNewPurchase(prev => ({ ...prev, vendor: e.target.value }))}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        fullWidth
                        size="small"
                        label="Memo"
                        value={newPurchase.memo}
                        onChange={(e) => setNewPurchase(prev => ({ ...prev, memo: e.target.value }))}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        type="number"
                        value={newPurchase.amount}
                        onChange={(e) => setNewPurchase(prev => ({ ...prev, amount: e.target.value }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Paid Date"
                          value={newPurchase.paidDate || null}
                          onChange={(date) => setNewPurchase(prev => ({ ...prev, paidDate: date }))}
                          renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                          disabled={!newPurchase.isPaid}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!newPurchase.isPaid}
                            onChange={e => {
                              const checked = e.target.checked;
                              setNewPurchase(prev => {
                                let paidDate = prev.paidDate;
                                if (checked && !paidDate) {
                                  paidDate = new Date();
                                } else if (!checked) {
                                  paidDate = null;
                                }
                                return { ...prev, isPaid: checked, paidDate };
                              });
                            }}
                            color="primary"
                          />
                        }
                        label="Is Paid?"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </DialogContent>
              <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={() => setAddPurchaseOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleAddPurchase}>Add</Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialDetails; 