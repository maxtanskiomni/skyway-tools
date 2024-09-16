import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Typography from '@mui/material/Typography';
import { StateManager } from '../../utilities/stateManager.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import moment from 'moment';


export default function ProfitSummary(props) {
  const { expenses = [], revenue = 0 } = props;
  const difference = revenue - expenses.reduce((a,c) => a + c.amount, 0);
  const [show, setShow] = React.useState(false);

  const toggleShow = () => setShow(!show);

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<Checkbox checked={show} onClick={toggleShow} />} label={'Profit'} />
      <Typography variant='body1' style={{display: !show ? "none" :'flex', alignItems: "center"}}>
        ${(difference || 0).toLocaleString(undefined, {minimumFractionDigits:2})}
      </Typography>
    </div>
  );
}
