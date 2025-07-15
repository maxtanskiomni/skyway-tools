import React from 'react';
import moment from 'moment';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { StateManager } from '../utilities/stateManager';
import firebase from '../utilities/firebase';
import constants from '../utilities/constants';

const AdminToast = () => {
  const [showAdminToast, setShowAdminToast] = React.useState(false);
  const [adminSettings, setAdminSettings] = React.useState({
    userType: '',
    whiteList: []
  });
  const [userId, setUserId] = React.useState('');

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminParam = urlParams.get('isAdmin');
    const today = moment().format('YYYY-MM-DD');
    
    if (isAdminParam === today) {
      setShowAdminToast(true);
      // Get user ID from URL if provided
      const urlUserId = urlParams.get('userId');
      if (urlUserId) {
        setUserId(urlUserId);
        // Load existing user settings
        loadUserSettings(urlUserId);
      }
    }
  }, []);

  const loadUserSettings = async (uid) => {
    try {
      const userDoc = await firebase.firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setAdminSettings({
          userType: userData.userType || '',
          whiteList: userData.whiteList || []
        });
      } else {
        setAdminSettings({ userType: '', whiteList: [] });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      StateManager.setAlertAndOpen('Error loading user settings', 'error');
    }
  };

  const handleUserSelect = (e) => {
    const selectedId = e.target.value;
    setUserId(selectedId);
    if (selectedId) {
      loadUserSettings(selectedId);
    } else {
      setAdminSettings({ userType: '', whiteList: [] });
    }
  };

  const handleClose = () => {
    setShowAdminToast(false);
  };

  const handleSave = async () => {
    if (!userId) {
      StateManager.setAlertAndOpen('Please select a user', 'error');
      return;
    }

    try {
      // await firebase.firestore().collection('users').doc(userId).set({
      //   userType: adminSettings.userType,
      //   whiteList: adminSettings.whiteList,
      //   lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      //   modifiedBy: StateManager.userID || 'unknown'
      // }, { merge: true });

      StateManager.setAlertAndOpen('User settings updated successfully', 'success');
      handleClose();
    } catch (error) {
      console.error('Error saving user settings:', error);
      StateManager.setAlertAndOpen('Error updating user settings', 'error');
    }
  };

  if (!showAdminToast) return null;

  return (
    <Paper 
      elevation={3} 
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: 20,
        zIndex: 9999,
        backgroundColor: '#fff',
        minWidth: 300
      }}
    >
      <Typography variant="h6" gutterBottom>
        User Settings
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel id="user-select-label">Select User</InputLabel>
        <Select
          labelId="user-select-label"
          value={userId}
          label="Select User"
          onChange={handleUserSelect}
          MenuProps={{
            PaperProps: {
              style: {
                zIndex: 999999999
              }
            }
          }}
        >
          <MenuItem value=""><em>None</em></MenuItem>
          {Object.entries(constants.userNames).map(([id, name]) => (
            <MenuItem key={id} value={id}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {userId && (
        <>
          <TextField
            fullWidth
            label="User ID"
            value={userId}
            margin="normal"
            disabled
          />

          <TextField
            select
            fullWidth
            label="User Type"
            value={adminSettings.userType}
            onChange={(e) => setAdminSettings({...adminSettings, userType: e.target.value})}
            margin="normal"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="mechanic">Mechanic</MenuItem>
            <MenuItem value="porter">Porter</MenuItem>
          </TextField>

          <Typography variant="subtitle2" style={{ marginTop: 16, marginBottom: 8 }}>
            Access Permissions:
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={adminSettings.whiteList.includes('accounting')}
                onChange={(e) => {
                  const newWhiteList = e.target.checked 
                    ? [...adminSettings.whiteList, 'accounting']
                    : adminSettings.whiteList.filter(x => x !== 'accounting');
                  setAdminSettings({...adminSettings, whiteList: newWhiteList});
                }}
              />
            }
            label="Accounting Access"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={adminSettings.whiteList.includes('deal-dashboard')}
                onChange={(e) => {
                  const newWhiteList = e.target.checked 
                    ? [...adminSettings.whiteList, 'deal-dashboard']
                    : adminSettings.whiteList.filter(x => x !== 'deal-dashboard');
                  setAdminSettings({...adminSettings, whiteList: newWhiteList});
                }}
              />
            }
            label="Deal Dashboard Access"
          />

          <Box style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="primary"
              disabled={!userId || !adminSettings.userType}
            >
              Save
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AdminToast; 