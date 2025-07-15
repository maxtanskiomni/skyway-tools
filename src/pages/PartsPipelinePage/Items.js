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


const headers = {
  pending: [ 
    {key:'date', label:'Date', format: "date", noLink:true},
    {key:'orderID', label:'SO Number', noLink:true},  
    // {key:'writer', label:'Writer', noLink:true},  
    {key:'carTitle', label:'Car', noLink:true}, 
    // {key:'service', label:'Service', noLink:true}, 
    {key:'name', label:'Part', noLink:true},
    {key:'partNumber', label:'Part Number', noLink:true},
    {key:'vendor', label:'Vendor', noLink:true},
    {key:'quantity', label:'Quantity', noLink:true},
    {key:'requester', label:'Requester', noLink:true},
    // {key:'orderDate', label:'Order Date', noLink:true},
    // {key:'arrivalDate', label:'Estimated Arrival', noLink:true, format: "date"},
    {key:'href', label:'Link', noLink:true}
  ],
  inbound: [ 
    {key:'date', label:'Date', format: "date", noLink:true},
    {key:'orderID', label:'SO Number', noLink:true},  
    // {key:'writer', label:'Writer', noLink:true},  
    {key:'carTitle', label:'Car', noLink:true}, 
    // {key:'service', label:'Service', noLink:true}, 
    {key:'name', label:'Part', noLink:true},
    {key:'partNumber', label:'Part Number', noLink:true},
    {key:'vendor', label:'Vendor', noLink:true},
    {key:'orderDate', label:'Order Date', noLink:true},
    {key:'arrivalDate', label:'Estimated Arrival', noLink:true, format: "date"},
    {key:'href', label:'Link', noLink:true}
  ],
  returning: [ 
    // {key:'date', label:'Date', format: "date", noLink:true},
    {key:'orderID', label:'SO Number', noLink:true},  
    // {key:'writer', label:'Writer', noLink:true},  
    {key:'carTitle', label:'Car', noLink:true}, 
    // {key:'service', label:'Service', noLink:true}, 
    {key:'name', label:'Part', noLink:true},
    {key:'partNumber', label:'Part Number', noLink:true},
    {key:'vendor', label:'Vendor', noLink:true},
    {key:'orderDate', label:'Order Date', noLink:true},
    {key:'arrivalDate', label:'Estimated Arrival', noLink:true, format: "date"},
    {key:'returnDate', label:'Return Date', noLink:true, format: "date"},
    // {key:'href', label:'Link', noLink:true}
  ]
};

const tables = {
  pending: "services",
  inbound:"services",
  returning: "services",
};

export default function Transactions(props) {
  const { items = [], stockNumber, type = "services", checkLimit = 1, disabled = false, showSummary, group = "",  disableItems = false } = props;
  const [transactions, setTransactions] = React.useState(items);

  const rows = transactions.map(transaction => {
    return makeObject(transaction, type, {transactions, setTransactions, stockNumber, disableItems});
  })
  .sort(function(a,b){
    const first = +(a.orderID.replace(/SO/g, ""));
    const second = +(b.orderID.replace(/SO/g, ""));
    return first - second;
  });

  const times = transactions.map(x => x.total_time).filter(x => x>0);
  const averageTime = Math.round(times.reduce((a, b) => a + b, 0) / (times.length || 1));

  const summary = [
    {label: 'Total', value: transactions.reduce((a,c) => a + 1, 0)},
    {label: 'Average Order Date', value: `${averageTime} days`},
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
    </Grid>
  );
}

const makeObject = (transaction, type, params = {}) => {

  return {
    ...transaction,
    isComplete:  ToggleIndicator(transaction.status === constants.service_statuses.at(-1), {type, id: transaction.id, disabled: params.disableItems}),
    mechanicName:  transaction.mechanic,
    rowLink: `/part/${transaction.id}`,
    orderLink: `/service-order/${transaction.order}`,
    serviceLink: transaction.serviceID ? `/service/${transaction.serviceID}` : "",
    carTitleLink: `/car/${transaction.car}`,
    href:  LinkButton(transaction),
    rowAction: () => StateManager.showPart && StateManager.showPart(transaction),
  }

}


const ToggleIndicator = (isEnabled, params) => {
  const [checked, setChecked] = React.useState(isEnabled);

  const toggleChecked = async (e) => {
    e.stopPropagation()
    const newChecked = !checked;
    setChecked(newChecked);

    const status = constants.service_statuses.at(!!checked ? 0 : -1);
    const status_time = !!checked ? null : moment().format("YYYY/MM/DD");
    await firebase.firestore().collection(tables[params.type]).doc(params.id).update({status, status_time});
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


const LinkButton = (part) => {
  const onClick = (e) => {
    e.stopPropagation();
    window.open(part.link, "_blank");
  }

  return (
    <IconButton aria-label="add-link" color="error" onClick={onClick} size="large">
      <ExitToApp />
    </IconButton>
  );
};