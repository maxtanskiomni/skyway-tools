import React, { useState, useEffect } from 'react';
import moment from 'moment';
import firebase from '../utilities/firebase';
import Blade from '../components/Blade';
import { 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  IconButton,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Material UI imports
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Container,
  Box,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

const CreditCardStatementPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(moment());
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [assignments, setAssignments] = useState([{
    stock: '',
    amount: 0,
    memo: '',
    isNew: true
  }]);
  const [serviceOrders, setServiceOrders] = useState([]);

  // Fetch transactions based on date range
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const db = firebase.firestore();
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');

        const snapshot = await db.collection('cc_statements')
          .where('date', '>=', startDateStr)
          .where('date', '<=', endDateStr)
          .get();

        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTransactions(transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [startDate, endDate]);

  // Fetch service orders
  useEffect(() => {
    const fetchServiceOrders = async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('orders')
          .where('status', '!=', 'complete')
          .get();
        
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.id.localeCompare(b.id));
        
        setServiceOrders(orders);
      } catch (error) {
        console.error('Error fetching service orders:', error);
      }
    };

    fetchServiceOrders();
  }, []);

  // Updated filter to include pending filter
  const filteredTransactions = transactions.filter(transaction => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = (
      transaction.description.toLowerCase().includes(searchString) ||
      transaction.amount.toString().includes(searchString) || 
      transaction.card.toLowerCase().includes(searchString)
    );
    
    // Apply pending filter if enabled
    if (showPendingOnly) {
      return matchesSearch && transaction.status !== 'assigned';
    }
    
    return matchesSearch;
  });

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    // Reset assignments with one empty one before fetching existing ones
    setAssignments([{
      stock: '',
      amount: transaction.amount, // Set initial amount to transaction amount
      memo: '',
      isNew: true
    }]);
    // Fetch existing assignments for this transaction
    fetchAssignments(transaction.id);
  };

  const fetchAssignments = async (transactionId) => {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection('purchases')
        .where('transaction_id', '==', transactionId)
        .get();
      
      const existingAssignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If there are existing assignments, use those instead of the empty one
      if (existingAssignments.length > 0) {
        setAssignments(existingAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, {
      stock: '',
      amount: 0,
      memo: '',
      isNew: true
    }]);
  };

  const handleSaveAssignments = async () => {
    try {
      const db = firebase.firestore();
      const batch = db.batch();

      // Process each assignment
      for (const assignment of assignments) {
        if (assignment.isNew) {
          // Create new assignment
          const newAssignmentRef = db.collection('purchases').doc();
          batch.set(newAssignmentRef, {
            transaction_id: selectedTransaction.id,
            stock: assignment.stock,
            amount: parseFloat(assignment.amount),
            memo: assignment.memo || '',
            type: 'service',
            date: selectedTransaction.date,
            vendor: selectedTransaction.description,
            isPayable: false
          });
        } else if (assignment.deleted) {
          // Delete existing assignment
          const assignmentRef = db.collection('purchases').doc(assignment.id);
          batch.delete(assignmentRef);
        } else {
          // Update existing assignment
          const assignmentRef = db.collection('purchases').doc(assignment.id);
          batch.update(assignmentRef, {
            stock: assignment.stock,
            amount: parseFloat(assignment.amount),
            vendor: selectedTransaction.description,
            memo: assignment.memo || ''
          });
        }
      }

      // Update the transaction status
      const transactionRef = db.collection('cc_statements').doc(selectedTransaction.id);
      batch.update(transactionRef, {
        status: assignments.filter(a => !a.deleted).length > 0 ? 'assigned' : 'pending',
        assignments: assignments.filter(a => !a.deleted).map(a => ({
          stock: a.stock,
          amount: parseFloat(a.amount),
          memo: a.memo || ''
        }))
      });

      await batch.commit();
      
      // Update local transaction data
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, status: assignments.filter(a => !a.deleted).length > 0 ? 'assigned' : 'pending' } 
          : t
      ));
      
      // Refresh assignments
      fetchAssignments(selectedTransaction.id);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  // Calculate total of all assignments
  const calculateAssignmentsTotal = () => {
    return assignments
      .filter(a => !a.deleted)
      .reduce((sum, assignment) => sum + parseFloat(assignment.amount || 0), 0);
  };

  // Check if assignments are valid
  const isAssignmentsValid = () => {
    if (assignments.filter(a => !a.deleted).length === 0) return true;

    if (!selectedTransaction) return false;
    
    // Check if all assignments have both service order and amount
    const allFieldsFilled = assignments
      .filter(a => !a.deleted)
      .every(a => a.stock && a.amount && a.memo);
    
    // Check if total matches transaction amount
    const totalMatches = Math.abs(calculateAssignmentsTotal() - selectedTransaction.amount) < 0.01;
    
    return allFieldsFilled && totalMatches;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Credit Card Statements
        </Typography>

        {/* Date Range Picker */}
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showPendingOnly}
                    onChange={(e) => setShowPendingOnly(e.target.checked)}
                  />
                }
                label="Show Pending Only"
              />
            </Stack>
          </Paper>
        </LocalizationProvider>

        {/* Search Box */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Transactions Table */}
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="transactions table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Card</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <TableCell>
                    {transaction.status === 'assigned' ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Assigned"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<PendingIcon />}
                        label="Pending"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {moment(transaction.date).format('MM/DD/YYYY')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.card}</TableCell>
                  <TableCell align="right" sx={{
                    color: transaction.amount > 0 ? 'black' : 'success.main',
                    fontWeight: 'bold'
                  }}>
                    {transaction.amount > 0 ? `-$${Math.abs(transaction.amount).toFixed(2)}` : `+$${Math.abs(transaction.amount).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Blade 
        open={!!selectedTransaction} 
        onClose={() => setSelectedTransaction(null)}
        title="Assign Transaction"
      >
        {selectedTransaction && (
          <Box sx={{ width: '100%', px: 3, py: 2 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3, 
                backgroundColor: '#f8f9fa',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transaction Details
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                {selectedTransaction.description}
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                color: selectedTransaction.amount > 0 ? 'error.main' : 'success.main',
                mb: 1
              }}>
                {selectedTransaction.amount > 0 ? '-' : '+'}${Math.abs(selectedTransaction.amount).toFixed(2)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {moment(selectedTransaction.date).format('MMMM D, YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">•</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTransaction.card}
                </Typography>
              </Stack>
            </Paper>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Assignments</Typography>

              <List sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                mb: 2
              }}>
                {assignments.map((assignment, index) => (
                  !assignment.deleted && (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{ 
                          py: 2,
                          px: { xs: 2, sm: 3 },
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.01)'
                          }
                        }}
                      >
                        <IconButton 
                          onClick={() => {
                            const newAssignments = [...assignments];
                            if (assignment.id) {
                              newAssignments[index].deleted = true;
                            } else {
                              newAssignments.splice(index, 1);
                            }
                            setAssignments(newAssignments);
                          }}
                          sx={{ 
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                              backgroundColor: 'error.lighter'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>

                        <Stack direction="column" spacing={2} sx={{ width: '100%', pr: { xs: 5, sm: 5 } }}>
                          <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            spacing={2} 
                            sx={{ width: '100%' }}
                          >
                            <TextField
                              select
                              label="Service Order"
                              value={assignment.stock}
                              onChange={(e) => {
                                const newAssignments = [...assignments];
                                newAssignments[index].stock = e.target.value;
                                setAssignments(newAssignments);
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '60%' }
                              }}
                              size="small"
                            >
                              <MenuItem value="payment">Card Payment</MenuItem>
                              <MenuItem value="shop_supplies">Shop Supplies</MenuItem>
                              {serviceOrders.map((order) => (
                                <MenuItem key={order.id} value={order.id}>
                                  {order.id}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label="Amount"
                              type="number"
                              value={assignment.amount}
                              onChange={(e) => {
                                const newAssignments = [...assignments];
                                newAssignments[index].amount = e.target.value;
                                setAssignments(newAssignments);
                              }}
                              sx={{ 
                                width: { xs: '100%', sm: '40%' }
                              }}
                              size="small"
                            />
                          </Stack>
                          <TextField
                            fullWidth
                            label="Memo"
                            value={assignment.memo || ''}
                            onChange={(e) => {
                              const newAssignments = [...assignments];
                              newAssignments[index].memo = e.target.value;
                              setAssignments(newAssignments);
                            }}
                            size="small"
                          />
                        </Stack>
                      </ListItem>
                      {index < assignments.filter(a => !a.deleted).length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  )
                ))}
              </List>

              <Box sx={{ mt: 3, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddAssignment}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.lighter'
                    }
                  }}
                >
                  Split Transaction
                </Button>
              </Box>

              {assignments.length > 0 && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    mt: 3, 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Total Assigned: ${calculateAssignmentsTotal().toFixed(2)}
                      </Typography>
                      {!isAssignmentsValid() && (
                        <Typography color="error.main" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          {calculateAssignmentsTotal() !== selectedTransaction.amount
                            ? `Difference: $${Math.abs(calculateAssignmentsTotal() - selectedTransaction.amount).toFixed(2)}`
                            : 'Please fill in all fields'}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      onClick={handleSaveAssignments}
                      disabled={!isAssignmentsValid()}
                      sx={{ 
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        backgroundColor: isAssignmentsValid() ? 'primary.main' : 'grey.300',
                        '&:hover': {
                          backgroundColor: isAssignmentsValid() ? 'primary.dark' : 'grey.400'
                        }
                      }}
                    >
                      {assignments.filter(a => !a.deleted).length > 0 ? 'Save Assignments' : 'Set Pending'}
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Blade>
    </Container>
  );
};

export default CreditCardStatementPage;
