import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';
import { StateManager } from '../utilities/stateManager';

const BankSelectorDialog = ({ open, onClose, onSend, car, disabled = false }) => {
  const [selectedBanks, setSelectedBanks] = React.useState([]);
  const [sending, setSending] = React.useState(false);

  const handleBankToggle = (bankId) => {
    setSelectedBanks(prev => 
      prev.includes(bankId)
        ? prev.filter(bank => bank !== bankId)
        : [...prev, bankId]
    );
  };

  const handleSend = async () => {
    if (selectedBanks.length === 0) return;
    
    setSending(true);
    try {
      await onSend(selectedBanks);
      setSelectedBanks([]);
      onClose();
    } catch (error) {
      console.error('Error sending credit app:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedBanks([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Banks for Credit Application</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: 16 }}>
          Select the banks you want to send the credit application to for {car?.year} {car?.make} {car?.model} (Stock: {car?.stock})
        </Typography>
        
        <List>
          {StateManager.banks.map((bank) => (
            <ListItem key={bank.value} disablePadding>
              <ListItemButton 
                dense 
                onClick={() => handleBankToggle(bank.data.id)}
                disabled={disabled}
              >
                <Checkbox
                  edge="start"
                  checked={selectedBanks.includes(bank.data.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText 
                  primary={bank.label}
                  secondary={bank.data?.address ? `${bank.data.address}, ${bank.data.city}, ${bank.data.state} ${bank.data.zip}` : ''}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {selectedBanks.length === 0 && (
          <Box style={{ marginTop: 16, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Please select at least one bank
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={sending}>
          Cancel
        </Button>
        <Button 
          onClick={handleSend} 
          variant="contained" 
          color="primary"
          disabled={selectedBanks.length === 0 || sending || disabled}
        >
          {sending ? 'Sending...' : `Send to ${selectedBanks.length} Bank${selectedBanks.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankSelectorDialog; 