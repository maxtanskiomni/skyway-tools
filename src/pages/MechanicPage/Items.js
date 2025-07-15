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
    {key:'isComplete', label:'Complete', noLink:true}, 
    {key:'isApproved', label:'Approved', noLink:true}, 
    {key:'priority', label:'Priority'}, 
    {key:'order', label:'Order'}, 
    {key:'writer', label:'Writer'}, 
    {key:'name', label:'Service'}, 
    {key:'carTitle', label:'Car'}, 
    {key:'mechanicName', label:'Mechanic'},
    {key:'time', label:'Hours'}, 
    {key:'cost', label:'Pay', format:'usd'},
    // {key:'actions', label:'Actions', noLink:true}
  ],
  complete: [ 
    {key:'isComplete', label:'Complete', noLink:true}, 
    {key:'isApproved', label:'Approved', noLink:true}, 
    {key:'status_time', label:'Date Finished'}, 
    {key:'order', label:'Order'}, 
    {key:'writer', label:'Writer'}, 
    {key:'name', label:'Service'}, 
    {key:'carTitle', label:'Car'}, 
    {key:'mechanicName', label:'Mechanic'},
    {key:'time', label:'Hours'}, 
    {key:'cost', label:'Pay', format:'usd'},
    // {key:'actions', label:'Actions', noLink:true}
  ]
};

const tables = {
  pending: "services",
  complete: "services",
};

export default function Transactions(props) {
  const { items = [], stockNumber, type = "pending", checkLimit = 1, disabled = false, showSummary, group = "" } = props;
  const [transactions, setTransactions] = React.useState(items)

  const rows = transactions.map(transaction => {
    return makeObject(transaction, type, {transactions, setTransactions, stockNumber});
  })
  .sort(function(a,b){
    return new Date(a.status_time || '1/1/2021') - new Date(b.status_time || '1/1/2021');
    })
  ;

  const mechSummary = constants.mechanicNames.map(name => {
    const filtered_items = rows.sort((a,b) => (a.priority || 0) - (b.priority || 0)).filter(service => service.mechanicName === name);
    return {label: name, value: filtered_items.reduce((a,c) => a + (c.time || 0), 0)}
  }).filter(line => line.value > 0)

  const summary = [
    ...mechSummary,
    {label: 'Total Hours', value: transactions.reduce((a,c) => a + (c.time || 0), 0)},
    {format: "usd", label: 'Total Value', value: transactions.reduce((a,c) => a + (c.cost || 0), 0)},
  ];

  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type],
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self" sorted summaryTop/>
      </Grid>
    </Grid>
  );
}

const makeObject = (transaction, type, params = {}) => {

  const disabled = !StateManager.isManager() && (transaction.approval !== "approved" || transaction.status === "complete")

  return {
    ...transaction,
    priority: transaction.priority || 0,
    isComplete:  ToggleIndicator(transaction.status === constants.service_statuses.at(-1), {checkType: "status", type, id: transaction.id, disabled}),
    isApproved:  ToggleIndicator(transaction.approval === "approved", {checkType: "approval", type, id: transaction.id, disabled: !StateManager.isManager()}),
    mechanicName:  transaction.mechanic,
    rowLink: `/service/${transaction.id}`,
    orderLink: `/service-order/${transaction.order}`,
    carTitleLink: `/car/${transaction.car}`
  }

}


const ToggleIndicator = (isEnabled, params) => {
  const [checked, setChecked] = React.useState(isEnabled);

  const toggleChecked = async (e) => {
    e.stopPropagation()
    const newChecked = !checked;
    setChecked(newChecked);

    if(params.checkType === "status") {
      const status = constants.service_statuses.at(!!checked ? 0 : -1);
      const status_time = !!checked ? null : moment().format("YYYY/MM/DD");
      await firebase.firestore().collection(tables[params.type]).doc(params.id).update({status, status_time});

    } else if(params.checkType === "approval") {
      const approval = !!checked ? "pending" : "approved";
      const approval_time = !!checked ? null : moment().format("YYYY/MM/DD"); 
      await firebase.firestore().collection(tables[params.type]).doc(params.id).update({approval, approval_time});

    }

  }

  return (
    <IconButton
      aria-label="add-link"
      color="secondary"
      onClick={toggleChecked}
      disabled={params.disabled}
      size="large">
      {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}