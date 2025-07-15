import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';

const PartsBlade = ({ order, onClose, onUpdate }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pendingPartId, setPendingPartId] = useState(null);
  const isAdmin = StateManager.isAdmin();

  // Fetch parts for this order
  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoading(true);
        const snapshot = await firebase.firestore()
          .collection('parts')
          .where('order', '==', order.id)
          .get();

        if (snapshot.empty) {
          setParts([]);
          return;
        }

        const partsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setParts(partsData);
      } catch (error) {
        console.error('Error fetching parts:', error);
        StateManager.setAlertAndOpen('Error fetching parts', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [order.id]);

  const handlePartUpdate = async (partId, updates) => {
    try {
      await firebase.firestore().collection('parts').doc(partId).update({
        ...updates,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local state
      const updatedParts = parts.map(part => 
        part.id === partId ? { ...part, ...updates } : part
      );
      setParts(updatedParts);
      onUpdate && onUpdate(updatedParts);
    } catch (error) {
      console.error('Error updating part:', error);
      StateManager.setAlertAndOpen('Error updating part', 'error');
    } 
  };

  const handleStatusChange = (partId, newStatus) => {
    if (isAdmin) {
      setPendingPartId(partId);
      setSelectedStatus(newStatus);
      setStatusDialogOpen(true);
    }
  };

  const handleStatusConfirm = () => {
    if (selectedStatus && pendingPartId) {
      const updates = { status: selectedStatus };
      
      // If status is 'complete', set arrival date if not already set
      if (selectedStatus === 'complete') {
        const currentPart = parts.find(p => p.id === pendingPartId);
        if (!currentPart.arrivalDate) {
          updates.arrivalDate = moment().format('YYYY/MM/DD');
        }
      }
      
      handlePartUpdate(pendingPartId, updates);
      
      // Reset dialog state
      setStatusDialogOpen(false);
      setSelectedStatus('');
      setPendingPartId(null);
    }
  };

  const handleStatusCancel = () => {
    setStatusDialogOpen(false);
    setSelectedStatus('');
    setPendingPartId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return theme.palette.info.main;
      case 'inbound':
        return theme.palette.primary.main;
      case 'returning':
        return theme.palette.error.main;
      case 'complete':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <InventoryIcon />;
      case 'inbound':
        return <LocalShippingIcon />;
      case 'returning':
        return <WarningIcon />;
      case 'complete':
        return <CheckCircleIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const filteredParts = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return parts.filter(part => 
      part.name?.toLowerCase().includes(searchLower) ||
      part.vendor?.toLowerCase().includes(searchLower) ||
      part.status?.toLowerCase().includes(searchLower)
    );
  }, [parts, searchQuery]);

  const PartsTable = ({ parts, title }) => (
    <>
      <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
        {title} ({parts.length})
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Part Name</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Arrival Date</TableCell>
              <TableCell align="right">Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(part.status)}
                    label={part.status ? part.status.charAt(0).toUpperCase() + part.status.slice(1) : 'Unknown'}
                    onClick={() => handleStatusChange(part.id, part.status)}
                    disabled={!isAdmin}
                    sx={{
                      bgcolor: alpha(getStatusColor(part.status), 0.1),
                      color: getStatusColor(part.status),
                      border: `1px solid ${alpha(getStatusColor(part.status), 0.3)}`,
                      cursor: isAdmin ? 'pointer' : 'default',
                      '&:hover': isAdmin ? {
                        bgcolor: alpha(getStatusColor(part.status), 0.2),
                      } : {},
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {part.name || 'Unnamed Part'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {part.vendor || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {part.arrivalDate ? moment(part.arrivalDate, 'YYYY/MM/DD').format('MMM DD, YYYY') : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <AttachMoneyIcon sx={{ mr: 0.5, color: theme.palette.text.secondary, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {part.cost ? `$${parseFloat(part.cost).toFixed(2)}` : '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading parts...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Search parts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      {filteredParts.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ py: 4 }}>
          <WarningIcon sx={{ fontSize: 48, color: theme.palette.warning.main }} />
          <Typography variant="h6" color="text.secondary">
            No parts found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No parts have been added to this service order yet.
          </Typography>
        </Box>
      ) : (
        <PartsTable parts={filteredParts} title="All Parts" />
      )}

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Update Part Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select the new status for this part:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
                          {constants.part_statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusCancel}>Cancel</Button>
          <Button 
            onClick={handleStatusConfirm} 
            variant="contained" 
            disabled={!selectedStatus}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsBlade; 