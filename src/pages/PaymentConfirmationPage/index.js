import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import { parseSearchString } from '../../utilities/store.js';
import CircularProgress from '@mui/material/CircularProgress';
import { StateManager } from '../../utilities/stateManager.js';
import PaymentConfirmation from '../../components/PaymentConfirmation.js';


export default function PaymentPage(props) {
  const classes = useStyles();
  StateManager.setTitle("Skyway Classics - Payment Status");


  return (
    <div className={classes.layout}>
      <Paper className={classes.paper}>
        <PaymentConfirmation />
      </Paper>
    </div>
  );
}


const useStyles = makeStyles((theme) => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
}));