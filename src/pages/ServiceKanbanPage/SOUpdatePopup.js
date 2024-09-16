import React from 'react';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import firebase from '../../utilities/firebase';
import { MenuItem, Select, FormControl, Button, Paper, Typography } from '@mui/material';

const MechanicUpdatePopup = () => {
  const [mechanic, setMechanic] = React.useState('');
  const [open, setOpen] = React.useState(false);
  StateManager.openSOSelect = () => {
    setOpen(StateManager.selectedSOs.length > 0);
  }

  const handleChange = (event) => {
    setMechanic(event.target.value);
  };

  const handleSubmit = async () => {
    if(!mechanic) return;
    const mechanicID = constants.mechanics.filter(mech => mech.name === mechanic).at(0).id;
    console.log('Updating mechanic:', mechanic, 'for SOs:', StateManager.selectedSOs, mechanicID);

    const db = firebase.firestore();
    const updates = StateManager.selectedSOs.map(serviceID => db.doc(`services/${serviceID}`).update({mechanic, mechanicID}));
    setOpen(false);
    await Promise.all(updates);
    await StateManager.resetBoard();
  };

  if (!open) return null;

  return (
    <Paper style={{ position: 'fixed', zIndex: 1500, bottom: 0, left: 0, right: 0, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="subtitle1">Update Mechanic for Selected SOs</Typography>
      <FormControl>
        <Select
          value={mechanic}
          onChange={handleChange}
          displayEmpty
          style={{ marginRight: 8 }}
          MenuProps={{
            style: {zIndex: 1600}
          }}
        >
          <MenuItem value="" disabled>Select Mechanic</MenuItem>
          {/* Add mechanic options here */}
          {constants.mechanics.filter(mech => mech.name !== "Placeholder").map((mech) => (
            <MenuItem key={mech.id} value={mech.name}>{mech.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button color="primary" variant="contained" onClick={handleSubmit}>
        Update
      </Button>
    </Paper>
  );
};

export default MechanicUpdatePopup;
