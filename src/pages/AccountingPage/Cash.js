import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import moment from 'moment';
import { StateManager } from '../../utilities/stateManager';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

export default function Cash(props) {
  const { data = {} } = props;
  const { cash = [] } = data;

  const addDeposit = () => {
    const tab = new URL(window.location.href).searchParams.get("tab");
    history.push(`/form/deposit-cash?redirect=accounting&tab=${tab}`)
  };

  const editCash = (entry) => {
    const tab = new URL(window.location.href).searchParams.get("tab");
    const userID = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if(userID !=="Ppg7VM83fVTugAj1tVifKa8amtF2") return;
    return `/form/edit-cash?redirect=accounting&tab=${tab}&cash=${entry.id}&memo=${entry.memo}&amount=${entry.amount}&date=${entry.date}`
  }

  let rows = cash.map(entry => {
    return {
      ...entry,
      memo: (entry?.memo || "").replace(/.+\| /g, ""),
      hasAccount: BinaryIndicator(entry.memo.split("|").length > 1),
      date: moment(entry.date).format("MM/DD/YYYY"),
      actions: deleteButton(entry.id),
      rowLink: editCash(entry)
    };
  });

  const summary = {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)};

  rows = rows.filter(x => moment(x.date).isAfter(moment("12/31/2022")));

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'hasAccount', label:'Accounting'},
      {key:'date', label:'Date'},
      {key:'user', label:'User'}, 
      {key:'memo', label:'Memo'}, 
      {key:'amount', label:'Amount', format:'usd'}, 
      // {key:'actions', label:'Actions'}
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          <SimpleTable {...tableData}/>
          <Button variant="contained" color="primary" onClick={addDeposit}>
            Add Entry Cash
          </Button>
      </Grid>
    </Grid>
  );
}

const dismiss = async (id) => {
  StateManager.setLoading(true);
  await firebase.firestore().collection('cash').doc(id).update({assigned: true});
  StateManager.updateData();
}

const deleteButton = (id) => (
  <Button variant="contained" color="primary" onClick={async (e) => {
    e.stopPropagation();
    dismiss(id)
    }}>
    Dismiss
  </Button>
);

const BinaryIndicator = (isEnabled) => (
  isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
);

