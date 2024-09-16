import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment';

export default function Deposits(props) {
  const { data = {} } = props;
  const { deposits = [] } = data;


  const rows = deposits.map(deposit => {
    deposit.date = moment(deposit.date).format("MM-DD-YY")
    return {
      ...deposit,
      rowLink: (deposit.stock || "").toUpperCase().includes("-FL") ? `../car/${deposit.stock}` : `../service-order/${deposit.stock}`,
    }
  });
  const summary = {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)};

  const tableData = {
    rows: rows.filter(x => !x.memo.includes("TFD")).reverse(),
    summary,
    headers: [{key:'date', label:'Date'}, {key:'stock', label:'Stock'}, {key:'car', label:'Vehicle'}, {key:'memo', label:'Memo'}, {key:'amount', label:'Amount', format:'usd'}],
    title: '', 
    sorted: true,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}