import React from 'react';

import useStyles from '../utilities/styles.js';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function PickerDialog(props) {
  const { onClose, value: valueProp, open, ...other } = props;
  const [value, setValue] = React.useState(valueProp);

  const [openRepair, setOpenRepair] = React.useState(false);
  const handleRepairClose = () => setOpenRepair(false);

  const [openCar, setOpenCar] = React.useState(false);
  const handleCarClose = () => setOpenCar(false);

  const classes = useStyles();

  const options = [
    {id:'car', label: 'Add New Car'},
    {id:'repair', label: 'Add Repair/Word'},
  ];

  React.useEffect(() => {
    if (!open) {
      setValue(valueProp);
    }
  }, [valueProp, open]);

  const handleOptionClick = optionID => {
    if(optionID === 'car') setOpenCar(true);
    if(optionID === 'repair') setOpenRepair(true);
    handleCancel();
  }

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    onClose(value);
  };

  return (
    <>
      <Dialog
        maxWidth="xs"
        aria-labelledby="confirmation-dialog-title"
        open={open}
        onClose={handleCancel}
        {...other}
      >
        <DialogTitle id="confirmation-dialog-title">Add data</DialogTitle>
        <DialogContent dividers>

          <List className={classes.root}>
            {
              options.map((option) => (
                <ListItem key={option.id} role={undefined} button onClick={() => handleOptionClick(option.id)}>
                  <ListItemText id={option.id} primary={option.label} />
                  <NavigateNextIcon />
                </ListItem>
              ))
            }
          </List>
        </DialogContent>
      </Dialog>

      <Dialog open={openRepair} onClose={handleRepairClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add Repair</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To register the repair with the accounting department, please enter the information below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="id"
            label="Stock Number"
            fullWidth
          />
          <TextField
            margin="dense"
            id="name"
            label="Repair name"
            fullWidth
          />
          <TextField
            margin="dense"
            id="vendor"
            label="Vendor"
            fullWidth
          />
          <TextField
            margin="dense"
            id="value"
            label="Cost"
            type="number"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRepairClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRepairClose} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCar} onClose={handleCarClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add Repair</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To register the car with the accounting department, please enter the information below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="id"
            label="Stock Number"
            fullWidth
          />
          <TextField
            margin="dense"
            id="year"
            label="Year"
            fullWidth
          />
          <TextField
            margin="dense"
            id="make"
            label="Make"
            fullWidth
          />
          <TextField
            margin="dense"
            id="model"
            label="Model"
            fullWidth
          />
          <TextField
            margin="dense"
            id="miles"
            label="Miles"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCarClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleOk} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}