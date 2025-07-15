import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Box,
  Checkbox,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import firebase from '../../utilities/firebase';
import moment from 'moment/moment';

export default function PurchasesTable({ purchases, stockNumber, disabled }) {
  const [open, setOpen] = React.useState(false);
  const [editingPurchase, setEditingPurchase] = React.useState(null);
  const [formData, setFormData] = React.useState({
    description: '',
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    isPayable: true
  });

  const handleOpen = (purchase = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        description: purchase.description || '',
        amount: purchase.amount || '',
        vendor: purchase.vendor || '',
        date: purchase.date || new Date().toISOString().split('T')[0],
        isPayable: purchase.isPayable || true
      });
    } else {
      setEditingPurchase(null);
      setFormData({
        description: '',
        amount: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        isPayable: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPurchase(null);
  };

  const handleSubmit = async () => {
    const db = firebase.firestore();
    const purchaseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      stock: stockNumber,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editingPurchase) {
      await db.collection('purchases').doc(editingPurchase.id).update(purchaseData);
    } else {
      purchaseData.created_at = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('purchases').add(purchaseData);
    }

    handleClose();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      await firebase.firestore().collection('purchases').doc(id).delete();
    }
  };

  const handleTogglePaid = async (purchase) => {
    try {
      const updates = {
        isPaid: !purchase.isPaid,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await firebase.firestore().collection('purchases').doc(purchase.id).update(updates);
    } catch (error) {
      console.error('Error toggling purchase paid status:', error);
    }
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          pb: 0
        }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
            <ShoppingCartIcon /> Purchases
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            disabled={disabled}
          >
            Add Purchase
          </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Is Paid</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.sort((a, b) => moment(b.date).diff(moment(a.date))).map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell align="center">
                  <Checkbox
                    checked={!purchase.isPayable}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleTogglePaid(purchase);
                    }}
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                <TableCell>{purchase.vendor}</TableCell>
                <TableCell>{purchase.description}</TableCell>
                <TableCell align="right">${purchase.amount?.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(purchase)}
                        disabled={disabled}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(purchase.id)}
                        disabled={disabled}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">No purchases found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: '$'
            }}
          />
          <TextField
            fullWidth
            label="Vendor"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Is Paid"
            value={formData.isPayable}
            onChange={(e) => setFormData({ ...formData, isPayable: e.target.value })}
            margin="normal"
          >
            <MenuItem value={false}>Yes</MenuItem>
            <MenuItem value={true}>No</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.description || !formData.amount}
          >
            {editingPurchase ? 'Save Changes' : 'Add Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 