import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';

import Store from '../../utilities/store.js';

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Preview from '../../components/Preview.js';

import Button from '@mui/material/Button';

export default function CustomerSummary() {
  const classes = useStyles();

  const [deal, setDeal] = React.useState(Store.deal);

  const [trades, setTrades] = React.useState(Store.trades || []);
  Store.addTrade = (trade) => {
    const newTradeList = [...trades, trade];
    setTrades(newTradeList);
    Store.trades = newTradeList;
  };

  const [errors, setErrors] = React.useState({});
  // const [disabled, setDisabled] = React.useState({});


  const onChange = (e) => {
    // validate(e);
    // newDeal[e.target.id] = e.target.value;
    deal[e.target.id] = e.target.value;
    setDeal(deal);
    Store.update('deal', e);
  }
  

  const data = [
    'first-name', 'last-name', 'email', 'phone-number',
  ];

  const files = [
    'license', 'insurance',
  ];

  return (
    <Paper className={classes.paper}>

      <Typography variant="h6" gutterBottom style={{textAlign: 'left'}}>
        Buyer Information
      </Typography>
      <div>
        <Button variant="contained" color="primary" onClick={() => null}>
          Request Buyer Data
        </Button>
      </div>
      <Grid container spacing={3} style={{marginBottom: 50}}>
        { 
          data.map(item => (
            <Grid item xs={12} sm={6}>
              <TextField
                onChange={onChange}
                id={item}
                name={item}
                label={formatTitle(item)}
                fullWidth
              />
            </Grid>
          ))
        }
        {
          files.map(item => (
            <Grid item xs={12} sm={6}>
              <Preview formName={'buyer'} cta={'Upload '+formatTitle(item)}/>
            </Grid>
          ))
        }
      </Grid> 

      <Typography variant="h6" gutterBottom style={{textAlign: 'left'}}>
        Co-Buyer Information
      </Typography>
      <div>
        <Button variant="contained" color="primary" onClick={() => null}>
          Request Co-Buyer Data
        </Button>
      </div>
      <Grid container spacing={3} style={{marginBottom: 50}}>
        { 
          data.map(item => (
            <Grid item xs={12} sm={6}>
              <TextField
                onChange={onChange}
                id={item}
                name={item}
                label={formatTitle(item)}
                fullWidth
              />
            </Grid>
          ))
        }
        {
          files.map(item => (
            <Grid item xs={12} sm={6}>
              <Preview formName={'buyer'} cta={'Upload '+formatTitle(item)}/>
            </Grid>
          ))
        }
      </Grid>
    </Paper>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    marginBottom: '10px'
  },
}));