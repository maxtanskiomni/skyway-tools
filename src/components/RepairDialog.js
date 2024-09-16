import React from 'react';

import useStyles from '../utilities/styles.js';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function RepairDialog(props) {
    const { open, onClose } = props;

    const confirm = () => console.log('confirm');
    const print = () => console.log('print');

    const classes = useStyles();
  
    return (
      <Dialog className={classes.dialog} open={open} onClose={onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter repair information
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Repair"
            type="text"
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            id="vendor"
            label="Vendor"
            type="text"
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            id="value"
            label="Cost"
            type="number"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={confirm} color="primary">
            Confirm Data
          </Button>
          <Button variant="contained" onClick={print} color="primary">
            Print Check
          </Button>
        </DialogActions>
      </Dialog>
    );
  }