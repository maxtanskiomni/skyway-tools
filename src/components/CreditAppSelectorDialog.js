import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import firebase from '../utilities/firebase';

const CreditAppSelectorDialog = ({ open, onClose, onSelect, customerId }) => {
  const [loading, setLoading] = React.useState(false);
  const [creditApps, setCreditApps] = React.useState([]);
  const [startDate, setStartDate] = React.useState(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = React.useState(moment().toDate());
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedApp, setSelectedApp] = React.useState(null);
  const [error, setError] = React.useState('');

  const fetchCreditApps = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError('');
    
    try {
      const db = firebase.firestore();
      const startDateStr = moment(startDate).format('YYYY-MM-DD');
      const endDateStr = moment(endDate).format('YYYY-MM-DD');
      
      let query = db.collection('credit-apps')
        .where('time', '>=', startDateStr)
        .where('time', '<=', endDateStr + 'ZZZZZZZZZZZZ');
      
      const snapshot = await query.get();
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      const sortedApps = apps.sort((a, b) => {
        const dateA = moment(a.time, 'YYYY-MM-DD').valueOf();
        const dateB = moment(b.time, 'YYYY-MM-DD').valueOf();
        return dateB - dateA; // Newest first
      });
      
      setCreditApps(sortedApps);
    } catch (err) {
      console.error('Error fetching credit apps:', err);
      setError('Failed to fetch credit applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchCreditApps();
    }
  }, [open, startDate, endDate]);

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  };

  const handleSearch = () => {
    fetchCreditApps();
  };

  const handleSelect = (app) => {
    setSelectedApp(app);
  };

  const handleConfirm = () => {
    if (selectedApp) {
      onSelect(selectedApp.location);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedApp(null);
    setSearchTerm('');
    setError('');
    onClose();
  };

  const filteredApps = creditApps.filter(app => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (app.first_name && app.first_name.toLowerCase().includes(searchLower)) ||
      (app.last_name && app.last_name.toLowerCase().includes(searchLower)) ||
      (app.phone_number && app.phone_number.includes(searchTerm)) ||
      (app.email && app.email.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString, 'YYYY-MM-DD').format('MM/DD/YYYY');
  };

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
          maxHeight: '90vh'
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon color="primary" />
          <Typography variant="h6">Select Credit Application</Typography>
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
          {/* Date Range Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Date Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <DatePicker
                selected={startDate}
                onChange={handleDateRangeChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                customInput={
                  <TextField 
                    size="small" 
                    placeholder="Start Date"
                    sx={{ minWidth: 150 }}
                  />
                }
                dateFormat="MM/dd/yyyy"
              />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <DatePicker
                selected={endDate}
                onChange={handleDateRangeChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                customInput={
                  <TextField 
                    size="small" 
                    placeholder="End Date"
                    sx={{ minWidth: 150 }}
                  />
                }
                dateFormat="MM/dd/yyyy"
              />
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </Box>
          </Grid>

          {/* Search Term */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Results */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                Credit Applications ({filteredApps.length})
              </Typography>
              {loading && <CircularProgress size={20} />}
            </Box>
            
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              maxHeight: 400,
              overflow: 'auto'
            }}>
              {filteredApps.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : 'No credit applications found for the selected criteria.'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredApps.map((app, index) => (
                    <React.Fragment key={app.id}>
                      <ListItem 
                        disablePadding
                        sx={{
                          backgroundColor: selectedApp?.id === app.id ? 'action.selected' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          }
                        }}
                      >
                        <ListItemButton onClick={() => handleSelect(app)}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                  {app.first_name || ''} {app.last_name || ''}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {app.phone_number && `Phone: ${app.phone_number}`}
                                  {app.phone_number && app.email && ' • '}
                                  {app.email && `Email: ${app.email}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Submitted: {formatDate(app.time)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < filteredApps.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={!selectedApp}
        >
          Select Application
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreditAppSelectorDialog; 