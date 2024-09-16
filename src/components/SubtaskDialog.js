import React from 'react';

import useStyles from '../utilities/styles.js';

import CheckboxList from './CheckboxList.js';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function SubtaskDialog(props) {
  const { open, onClose, data } = props;
  const { label, tasks, subtasks } = data;

  const classes = useStyles();

  const confirm = () => {
    console.log('confirm');
    onClose();
  };

  return (
    <Dialog className={classes.dialog} open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{label}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Subtasks required.
        </DialogContentText>
        <CheckboxList tasks={tasks || subtasks || []} />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={confirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}