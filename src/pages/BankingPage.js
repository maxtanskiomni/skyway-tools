import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Box,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import moment from 'moment';
import RequestManager from '../utilities/requestManager';
import { StateManager } from '../utilities/stateManager';

const BankingPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [plaidItems, setPlaidItems] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState(moment().toDate());
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Fetch link token on component mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const params = {
          function: "createLinkToken",
          variables: { userID: "skyway-classics", clientName: "Skyway Classics" }
        };
        const response = await RequestManager.post(params);
        setLinkToken(response.link_token);
      } catch (error) {
        console.error('Error fetching link token:', error);
        StateManager.setAlertAndOpen('Failed to initialize Plaid connection', 'error');
      }
    };

    fetchLinkToken();
  }, []);

  const onSuccess = useCallback(async (publicToken, metadata) => {
    try {
      StateManager.setAlertAndOpen("Connecting account", "info");
      const params = {
        function: "exchangePublicToken",
        variables: { userID: "skyway-classics", publicToken }
      };
      const response = await RequestManager.post(params);
      
      if (response.success) {
        StateManager.setAlertAndOpen("Connection successful!", "success");
        StateManager.updatePlaid();
        window.location.reload();
      } else {
        throw new Error('Failed to exchange public token');
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
      StateManager.setAlertAndOpen('Failed to connect account', 'error');
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  // Fetch connected Plaid items
  useEffect(() => {
    const fetchPlaidItems = async () => {
      try {
        const response = await fetch('/getItems', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const { items } = await response.json();
        setPlaidItems(items);

        // For each item, fetch its balances
        const itemsWithBalances = await Promise.all(
          items.map(async (item) => {
            const balancesResponse = await fetch(`/getBalances?itemId=${item.itemId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const balances = await balancesResponse.json();
            return { ...item, balances };
          })
        );

        // Transform items into accounts format
        const accountsData = itemsWithBalances.flatMap(item => 
          item.balances.accounts.map(account => ({
            id: account.account_id,
            itemId: item.itemId,
            name: account.name,
            institution: account.institution_name || 'Unknown Institution',
            type: account.type,
            balance: account.balances.current,
            mask: account.mask
          }))
        );
        setAccounts(accountsData);

        // Fetch transactions for each item
        const today = new Date();
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        const transactionsPromises = items.map(item =>
          fetch(`/getTransactions?itemId=${item.itemId}&startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }).then(res => res.json())
        );

        const transactionsResults = await Promise.all(transactionsPromises);
        const allTransactions = transactionsResults.flatMap(result => 
          result.transactions.map(transaction => ({
            id: transaction.transaction_id,
            accountId: transaction.account_id,
            name: transaction.name,
            amount: transaction.amount,
            date: transaction.date,
            category: transaction.category
          }))
        );
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching banking data:', error);
        StateManager.setAlertAndOpen('Failed to fetch banking data', 'error');
      }
    };

    fetchPlaidItems();
  }, []);

  const handleDisconnectAccount = async (itemId) => {
    try {
      const response = await fetch(`/removeItem?itemId=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        StateManager.setAlertAndOpen('Account disconnected successfully', 'success');
        window.location.reload();
      } else {
        throw new Error('Failed to disconnect account');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      StateManager.setAlertAndOpen('Failed to disconnect account', 'error');
    }
  };

  const handleRefreshTransactions = async () => {
    setLoading(true);
    try {
      // Refresh transactions for all connected items
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const transactionsPromises = plaidItems.map(item =>
        fetch(`/getTransactions?itemId=${item.itemId}&startDate=${startDate}&endDate=${endDate}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => res.json())
      );

      const transactionsResults = await Promise.all(transactionsPromises);
      const allTransactions = transactionsResults.flatMap(result => 
        result.transactions.map(transaction => ({
          id: transaction.transaction_id,
          accountId: transaction.account_id,
          name: transaction.name,
          amount: transaction.amount,
          date: transaction.date,
          category: transaction.category
        }))
      );
      setTransactions(allTransactions);
      StateManager.setAlertAndOpen('Transactions refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      StateManager.setAlertAndOpen('Failed to refresh transactions', 'error');
    }
    setLoading(false);
  };

  // Filter transactions whenever filters change
  useEffect(() => {
    if (!selectedAccount) return;

    let filtered = transactions.filter(t => t.accountId === selectedAccount.id);

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.category?.some(c => c.toLowerCase().includes(term))
      );
    }

    // Apply amount filters
    if (minAmount !== '') {
      filtered = filtered.filter(t => t.amount >= parseFloat(minAmount));
    }
    if (maxAmount !== '') {
      filtered = filtered.filter(t => t.amount <= parseFloat(maxAmount));
    }

    // Apply date filters
    filtered = filtered.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    });

    setFilteredTransactions(filtered);
  }, [transactions, selectedAccount, searchTerm, minAmount, maxAmount, startDate, endDate]);

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setSearchTerm('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate(moment().subtract(30, 'days').toDate());
    setEndDate(moment().toDate());
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate(moment().subtract(30, 'days').toDate());
    setEndDate(moment().toDate());
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Banking Management
        </Typography>

        {/* Controls Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2}>
            {/* Account Management */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Account</InputLabel>
                <Select
                  value={selectedAccount?.id || ''}
                  label="Select Account"
                  onChange={(e) => {
                    const account = accounts.find(a => a.id === e.target.value);
                    handleAccountSelect(account);
                  }}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.institution}) - {account.type} ({account.mask})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => open()}
                  disabled={!ready}
                  startIcon={<AccountBalanceIcon />}
                  sx={{ mr: 1 }}
                >
                  Connect Account
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRefreshTransactions}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* Filters */}
            {selectedAccount && (
              <>
                <Divider />
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Search Transactions"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={moment(startDate).format('YYYY-MM-DD')}
                      onChange={(e) => setStartDate(moment(e.target.value).toDate())}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={moment(endDate).format('YYYY-MM-DD')}
                      onChange={(e) => setEndDate(moment(e.target.value).toDate())}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="Min Amount"
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        size="small"
                      />
                      <TextField
                        label="Max Amount"
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="text"
                    onClick={clearFilters}
                    startIcon={<FilterListIcon />}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        </Paper>

        {/* Transactions Section */}
        {selectedAccount ? (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Transactions for {selectedAccount.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredTransactions.length} transactions
              </Typography>
            </Box>

            <List>
              {filteredTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <ListItem>
                    <ListItemText
                      primary={transaction.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          <Chip
                            label={new Date(transaction.date).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                          {transaction.category?.map((cat, index) => (
                            <Chip
                              key={index}
                              label={cat}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      }
                    />
                    <Typography
                      variant="body1"
                      color={transaction.amount < 0 ? 'error.main' : 'success.main'}
                      sx={{ fontWeight: 'medium' }}
                    >
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </Typography>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {filteredTransactions.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No transactions found"
                    secondary="Try adjusting your filters or select a different date range"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select an account to view transactions
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default BankingPage; 