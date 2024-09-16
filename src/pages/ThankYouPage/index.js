import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import { parseSearchString } from '../../utilities/store.js';
import CircularProgress from '@mui/material/CircularProgress';
import { StateManager } from '../../utilities/stateManager.js';

import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';


const icons = {
  succeeded: <DoneOutlineIcon color="success" style={{ fontSize: 60, color: "green" }} />,
  processing: <HourglassEmptyIcon color="secondary" style={{ fontSize: 60, color: "gold"  }} />,
  requires_payment_method: <ErrorIcon color="error" style={{ fontSize: 60, color: "red" }} />,
  default: null,
};

export default function ThankYouPage(props) {
  const classes = useStyles();
  StateManager.setTitle("Skyway Classics - Thank you");

  const [message, setMessage] = React.useState("Submission successful!");
  const [submessage, setSubMessage] = React.useState("We will be in touch soon. Thank you for choosing Skyway Classics.");
  const [status, setStatus] = React.useState("succeeded");


  return (
    <div className={classes.layout}>
      <Paper className={classes.paper}>
        <>
          {icons[status]}
          <h2>
            {message}
          </h2>
          <p style={{fontSize: 16}}>
            {submessage}
          </p>
        </>
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