import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select } from '@mui/material';
import moment from 'moment';
import SOUpdatePopup from './SOUpdatePopup';


const headers = {
  services: [ 
    {key:'select', label:'', noLink:true, noAction:true},
    {key:'status_time', label:'Date', format: "date"},
    {key:'writer', label:'Writter'},
    {key:'id', label:'SO Number'},  
    {key:'carTitle', label:'Car'}, 
    {key:'customer', label:'Customer'},
    {key:'total_time', label:'Status Time'},
    {key:'order_time', label:'Total Time'},
    // {key:'mechanicName', label:'Mechanic'},
    // {key:'time', label:'Hours'}, 
    StateManager.userType === "admin" ? {key:'revenue', label:'Revenue', format:'usd'} : {},
    // {key:'actions', label:'Actions', noLink:true}
  ]
};

const tables = {
  services: "services",
};

export default function Transactions(props) {
  const { items = [], stockNumber, type = "services", checkLimit = 1, disabled = false, showSummary, group = "",  disableItems = false } = props;
  const [transactions, setTransactions] = React.useState(items);

  const rows = transactions.map(transaction => {
    return makeObject(transaction, type, {transactions, setTransactions, stockNumber, disableItems});
  })
  .sort(function(a,b){
    const first = +((a.status_time || '2021/1/1/').replace(/\//g, ""));
    const second = +((b.status_time || '2021/1/1').replace(/\//g, ""));
    return first - second;
  });

  const times = transactions.map(x => x.total_time).filter(x => x>0);
  const averageTime = Math.round(times.reduce((a, b) => a + b, 0) / (times.length || 1));

  const summary = [
    {label: 'Total', value: transactions.reduce((a,c) => a + 1, 0)},
    {label: 'Average Order Date', value: `${averageTime} days`},
    StateManager.userType === "admin" ? {label: 'Revenue', value: transactions.reduce((a,c) => a + (c.revenue || 0), 0), format: "usd"} : {},
  ];



  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type],
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self" sorted/>
      </Grid>
      <SOUpdatePopup />
    </Grid>
  );
}

const makeObject = (transaction, type, params = {}) => {

  return {
    ...transaction,
    isComplete:  ToggleIndicator(transaction.status === constants.service_statuses.at(-1), {type, id: transaction.id, disabled: params.disableItems}),
    select:  ToggleIndicator(false, {type, id: transaction.id, disabled: params.disableItems}),
    mechanicName:  transaction.mechanic,
    rowLink: `/service-order/${transaction.id}`,
    // orderLink: `/service-order/${transaction.order}`,
    // carTitleLink: `/car/${transaction.car}`
  }

}


const ToggleIndicator = (isEnabled, params) => {
  const [checked, setChecked] = React.useState(isEnabled);


  const toggleChecked = async (e) => {
    e.stopPropagation();
   
    //Intialize it if needed
    if(!StateManager.selectedSOs) StateManager.selectedSOs = [];

    //If seleted, then the user is unselecting it
    if(checked){
      StateManager.selectedSOs = StateManager.selectedSOs.filter(id => id !== params.id);
    }
    //If not seleted, then the user is selecting it
    else{
      StateManager.selectedSOs = [...StateManager.selectedSOs, params.id];
    }

    StateManager.openSOSelect();
    setChecked(!checked);
  }

  return (
    <IconButton
      aria-label="add-link"
      color="error"
      onClick={toggleChecked}
      disabled={params.disabled}
      size="large">
      {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}