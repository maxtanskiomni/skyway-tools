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
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';


const headers = {
  expenses: [
    {key:'isPaid', label:'Paid', noLink:true}, 
    {key:'date', label:'Date'},
    {key:'memo', label:'Memo'}, 
    {key:'amount', label:'Amount', format:'usd'}, 
    {key:'actions', label:'Actions', noLink:true}
  ],
  deposits: [ 
    {key:'date', label:'Date'},
    {key:'memo', label:'Memo'}, 
    {key:'amount', label:'Amount', format:'usd'}, 
    {key:'actions', label:'Actions', noLink:true}
  ]
};

const tables = {
  expenses: "purchases",
  deposits: "deposits",
};

const check = (x, t = 0) => x.reduce((a,c) => a + c.amount, 0) >= t;

export default function Transactions(props) {
  const { items = [], stockNumber, type = "", checkLimit = 1, disabled = false, showSummary, group = "" } = props;
  const [transactions, setTransactions] = React.useState(items);

  // if(items.length <= 0) return <Loading />

  const rows = transactions.map(transaction => {
    const variables = Object.keys(transaction)
                            .filter(key => key !== 'e')
                            .map(key => `${key}=${transaction[key]}`).join("&");

    const tab = new URL(window.location.href).searchParams.get("tab");
    return {
      ...transaction,
      isPaid:  BinaryIndicator(!transaction.isPayable),
      actions: Actions(transaction.id, transaction.files, {transactions, setTransactions, type}, props.disabled),
      rowLink: `../form/edit-${type}?${type[0]}=${transaction.id}&${variables}&tab=${tab}&redirect=/car/${stockNumber}`,
    }
  });

  const summary = {format: 'usd', label: 'Total', value: transactions.reduce((a,c) => a + c.amount, 0)};

  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type],
    // title: 'Vehicle cost items', 
  };

  const onClick = (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");

    const destination = `/form/car-${type}?stock=${stockNumber}&redirect=${redirect}&tab=${tab}&type=${group}`;
    history.push(destination);
  }

  return (
    <Accordion>
      <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
          <FormControlLabel control={<Checkbox checked={check(transactions, checkLimit)} onClick={e => e.stopPropagation()} />} label={StateManager.formatTitle(type)} />
          <Typography variant='body1' style={{display: 'flex', alignItems: "center"}}>
            ${(summary.value || 0).toLocaleString(undefined, {minimumFractionDigits:2})}
          </Typography>
        </div>

      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SimpleTable {...tableData} linkLocation="_self" disabled={props.disabled}/>
          </Grid>
          <Grid item xs={12}>
            <Button disabled={disabled} variant="contained" color="primary" onClick={onClick}>
              Add {StateManager.formatTitle(type.slice(0, -1))}
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

const BinaryIndicator = (isEnabled) => (
  isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
);

const deleteRow = async (id, updater) => {
  if (window.confirm("Are you sure you want to delete this?")) {
    StateManager.setLoading(true);
    await firebase.firestore().collection(tables[updater.type]).doc(id).delete();
    const newTransactions = updater.transactions.filter(x => x.id !== id);
    updater.setTransactions(newTransactions);
    StateManager.setLoading(false);
  }
}


const showFile = async (fileLocation) => {
  let link = document.createElement('a');
  link.href = await firebase.storage().ref(fileLocation).getDownloadURL();
  link.target = "_blank";
  link.click();
}

const Actions = (id, files, updater, disabled) => (
  <>
    {
      files ? <IconButton
        aria-label="add-link"
        color="secondary"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          showFile(files[0])
          }}
        size="large">
        <Receipt />
      </IconButton>
      : null
    }
    <IconButton
      aria-label="add-link"
      color="error"
      onClick={(e) => {
        e.stopPropagation()
        deleteRow(id, updater)
        }}
      disabled={disabled}
      size="large">
      <Delete />
    </IconButton>
  </>
);

const Loading = (props) =>  (
  <Paper>
    <div>
      <CircularProgress color="primary" />
    </div>
  </Paper>
);