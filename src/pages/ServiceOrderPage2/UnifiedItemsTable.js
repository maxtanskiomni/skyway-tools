import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Link as LinkIcon,
  CheckBox,
  CheckBoxOutlineBlank,
  Sync as SyncIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import DateSelector from '../../components/DateSelector';
import history from '../../utilities/history';

const headers = [
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'name', label: 'Description' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'date', label: 'Date' },
  { key: 'arrival_date', label: 'Est. Arrival' },
  { key: 'amount', label: 'Amount', format: 'usd' },
  { key: 'actions', label: '' }
];

const UnifiedItemsTable = ({ parts = [], purchases = [], stockNumber, disabled }) => {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    // Combine and format items
    const formattedParts = parts.map(part => ({
      ...part,
      type: 'Part',
      amount: part.cost || 0,
      date: part.date || part.created_at,
      status: part.status || 'Pending',
      arrival_date: part.arrival_date,
      itemType: 'part'
    }));

    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      type: 'Purchase',
      amount: purchase.amount || 0,
      date: purchase.date || purchase.created_at,
      status: purchase.isComplete ? 'Paid' : 'Pending',
      itemType: 'purchase'
    }));

    // Sort by date, most recent first
    const allItems = [...formattedParts, ...formattedPurchases].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    setItems(allItems);
  }, [parts, purchases]);

  const handleStatusChange = async (item, newStatus) => {
    try {
      const collection = item.itemType === 'part' ? 'parts' : 'purchases';
      await firebase.firestore().collection(collection).doc(item.id).update({
        status: newStatus,
        status_time: new Date().toISOString()
      });

      setItems(items.map(i => 
        i.id === item.id ? { ...i, status: newStatus } : i
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      StateManager.setAlertAndOpen('Error updating status', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const collection = item.itemType === 'part' ? 'parts' : 'purchases';
      await firebase.firestore().collection(collection).doc(item.id).delete();
      setItems(items.filter(i => i.id !== item.id));
      StateManager.setAlertAndOpen('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      StateManager.setAlertAndOpen('Error deleting item', 'error');
    }
  };

  const handleDateChange = async (item, newDate) => {
    try {
      const collection = item.itemType === 'part' ? 'parts' : 'purchases';
      const field = item.itemType === 'part' ? 'arrival_date' : 'date';
      await firebase.firestore().collection(collection).doc(item.id).update({
        [field]: newDate
      });

      setItems(items.map(i => 
        i.id === item.id ? { ...i, [field]: newDate } : i
      ));
    } catch (error) {
      console.error('Error updating date:', error);
      StateManager.setAlertAndOpen('Error updating date', 'error');
    }
  };

  const handleAddItem = (type) => {
    const url = new URL(window.location.href);
    const redirect = url.pathname;
    const destination = `/form/order-${type === 'part' ? 'parts' : 'expenses'}?order=${stockNumber}&stock=${stockNumber}&redirect=${redirect}`;
    history.push(destination);
  };

  const renderStatus = (item) => {
    if (item.itemType === 'purchase') {
      return (
        <Chip
          label={item.status}
          color={item.status === 'Paid' ? 'success' : 'default'}
          size="small"
          onClick={() => handleStatusChange(item, item.status === 'Paid' ? 'Pending' : 'Paid')}
          sx={{ cursor: 'pointer' }}
        />
      );
    }

    return (
      <Select
        value={item.status}
        onChange={(e) => handleStatusChange(item, e.target.value)}
        size="small"
        disabled={disabled}
        sx={{ minWidth: 120 }}
      >
        {constants.part_statuses.map(status => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    );
  };

  const renderDate = (item) => {
    if (item.itemType === 'part') {
      return (
        <DateSelector
          value={item.arrival_date}
          onChange={(date) => handleDateChange(item, date)}
          disabled={disabled}
        />
      );
    }
    return format(new Date(item.date), 'MM/dd/yyyy');
  };

  const renderActions = (item) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {item.itemType === 'part' && item.href && (
        <Tooltip title="View Link">
          <IconButton
            size="small"
            onClick={() => window.open(item.href, '_blank')}
            disabled={disabled}
          >
            <LinkIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => handleDelete(item)}
          disabled={disabled}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map(header => (
                <TableCell key={header.key}>
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.type}</TableCell>
                <TableCell>{renderStatus(item)}</TableCell>
                <TableCell>{item.name || item.memo}</TableCell>
                <TableCell>{item.vendor}</TableCell>
                <TableCell>{format(new Date(item.date), 'MM/dd/yyyy')}</TableCell>
                <TableCell>{renderDate(item)}</TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(item.amount)}
                </TableCell>
                <TableCell>{renderActions(item)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={6} align="right">
                <Typography variant="subtitle1">Total:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalAmount)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleAddItem('part')}
          disabled={disabled}
        >
          Add Part
        </Button>
        <Button
          variant="contained"
          onClick={() => handleAddItem('purchase')}
          disabled={disabled}
        >
          Add Purchase
        </Button>
      </Box>
    </Box>
  );
};

export default UnifiedItemsTable; 