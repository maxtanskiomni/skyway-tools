import React from 'react';
import moment from 'moment';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { StateManager } from '../utilities/stateManager';
import constants from '../utilities/constants';

const MechanicToast = () => {
  const [showMechanicToast, setShowMechanicToast] = React.useState(false);
  const [selectedMechanic, setSelectedMechanic] = React.useState('');

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isMechanicParam = urlParams.get('isMechanic');
    const today = moment().format('YYYY-MM-DD');
    
    if (isMechanicParam === today) {
      setShowMechanicToast(true);
      if (StateManager.mechanicId) {
        setSelectedMechanic(StateManager.mechanicId);
      }
    }
  }, []);

  const handleClose = () => {
    if (selectedMechanic === "") {
      StateManager.clearMechanicState();
    }
    setShowMechanicToast(false);
  };

  const handleSave = () => {
    if (!selectedMechanic) {
      StateManager.setAlertAndOpen('Please select a mechanic', 'error');
      return;
    }

    const [mechanic] = constants.mechanics.filter(mech => mech.id === selectedMechanic);
    if (!mechanic) {
      StateManager.setAlertAndOpen('Invalid mechanic selection', 'error');
      return;
    }

    StateManager.setMechanicState(mechanic.id, mechanic.name);
    
    StateManager.setAlertAndOpen('Mechanic updated successfully', 'success');
    
    handleClose();
    
    window.location.href = window.location.pathname;
  };

  if (!showMechanicToast) return null;

  return (
    <Paper 
      elevation={3} 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: 20,
        zIndex: 9999,
        backgroundColor: '#fff',
        minWidth: 300,
        maxWidth: '90%'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Select Mechanic
      </Typography>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Mechanic</InputLabel>
        <Select
          value={selectedMechanic}
          onChange={(e) => setSelectedMechanic(e.target.value)}
          label="Mechanic"
          MenuProps={{
            style: { zIndex: 10000 },
            PaperProps: {
              style: { zIndex: 10000 }
            }
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {constants.mechanics
            .filter(mech => mech.name !== "Placeholder")
            .map((mech) => (
              <MenuItem key={mech.id} value={mech.id}>
                {mech.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <Box style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!selectedMechanic}
        >
          Save
        </Button>
      </Box>
    </Paper>
  );
};

export default MechanicToast; 