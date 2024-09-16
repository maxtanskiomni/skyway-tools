import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';

import Store from '../../utilities/store.js';
import Preview from '../../components/Preview.js';

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function DMVSummary(props) {
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
    'recieved-on', 'taken-on', 'sent-to-customer-on', 
  ];


  return (
    <Paper className={classes.paper}>
      {/* <Typography variant="h6" gutterBottom style={{textAlign: 'left'}}>
        Car Information
      </Typography> */}
      <Grid container spacing={3}>
        { 
          data.map(item => (
            <Grid item xs={12} sm={6}>
              <TextField
                defaultValue={deal.stockNumber || ''}
                onChange={onChange}
                id={item}
                name={item}
                label={formatTitle(item)}
                fullWidth
              />
            </Grid>
          ))
        }
      </Grid>
      <Preview drop={true} cta={props.cta || 'Upload File'} />
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