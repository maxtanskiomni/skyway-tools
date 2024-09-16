import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { parseSearchString } from '../../utilities/store.js';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { StateManager } from '../../utilities/stateManager';
import PaymentForm from '../../components/PaymentForm';
import RequestManager from '../../utilities/requestManager.js';
import SimpleTable from '../../components/SimpleTable.js';


const headers = [
  // {key:'number', label:'', noLink:true}, 
  {key:'item', label:'Item', noLink:true}, 
  {key:'amount', label:'Amount', format:'usd'}, 
];

export default function PaymentPage(props) {
  const urlParams = parseSearchString(props.location.search);
  const { intent, stock, type, thumbnail, title, i = "", c = "" }  = urlParams;
  const classes = useStyles();
  StateManager.setTitle("Skyway Classics - Payment Form");


  const items = i.split(",").map(x => cleanEncodings(x));
  const charges = c.split(",").map(x => Number(x) || 0);
  const total = charges.reduce((a,c) => a + (c || 0), 0);

  const rows = items.map((item, i) => ({item, amount: charges.at(i)}));
  const summary = {format: 'usd', label: 'Total', value: total};

  const tableData = {
    rows,
    summary: summary,
    headers,
    // title: 'Summary of Items', 
  };

  return (
    <div className={classes.layout}>
      <Paper className={classes.paper}>
        <Typography component="h1" variant="h4" align="center">
          {props.title || 'Skyway Classics Checkout Form'}
        </Typography>
        <div style={{
          backgroundColor: 'white', 
          padding: '17px', 
          marginBottom: "3px",
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between',
          borderBottomWidth: '3px' 
        }}>
          <div style={{width: "100%", display: 'flex', flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
            {thumbnail && <img style={{ width: "100%" }} src={thumbnail} />}
            <h3>{stock || ""} {cleanEncodings(title || "")}</h3>
          </div>
        </div>

        {items.length > 0 && 
          <div style={{marginTop: "1vh"}}>
            <h2>
              {props.cart_title || 'Your Cart'}
            </h2>
            <SimpleTable {...tableData} />
          </div>
        }

        <div style={{marginTop: "3vh"}}>
        <h2>
          {props.checkout_title || 'Checkout'}
        </h2>
        <PaymentForm intent={intent} amount={total} />
        </div>
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


const toTitleCase = s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase();

const cleanEncodings = s => {
  s = s.replace(/%20/g, " ");
  return s
}