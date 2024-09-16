import React from 'react';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import firebase from '../../utilities/firebase';
import { MenuItem, Select, FormControl, Button, Paper, Typography } from '@mui/material';

const ServiceUpdatePopup = () => {
  const [status, setStatus] = React.useState('');
  const [open, setOpen] = React.useState(false);
  StateManager.openSOSelect = () => {
    setOpen(StateManager.selectedSOs.length > 0);
  }

  const handleChange = (event) => {
    setStatus(event.target.value);
  };

  const handleSubmit = async () => {
    if(!status) return;
    console.log('Updating status:', status, 'for SOs:', StateManager.selectedSOs);

    const db = firebase.firestore();
    const updates = StateManager.selectedSOs.map(orderID => db.doc(`orders/${orderID}`).update({status}));
    setOpen(false);
    await Promise.all(updates);
    await StateManager.updatePipeline();
  };

  if (!open) return null;

  return (
    <Paper style={{ position: 'fixed', zIndex: 1500, bottom: 0, left: 0, right: 0, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="subtitle1">Update Status</Typography>
      <FormControl>
        <Select
          value={status}
          onChange={handleChange}
          displayEmpty
          style={{ marginRight: 8 }}
          MenuProps={{
            style: {zIndex: 1600}
          }}
        >
          <MenuItem value="" disabled>Select Service</MenuItem>
          {/* Add status options here */}
          {constants.order_statuses.filter(x => x !== "complete").map((status) => (
            <MenuItem key={status} value={status}>{status}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button color="primary" variant="contained" onClick={handleSubmit}>
        Update
      </Button>
    </Paper>
  );
};

export default ServiceUpdatePopup;
