import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment/moment';

export default function Deals(props) {
  let { rows, filter = () => null } = props;
  rows = rows.filter(filter).sort((a, b) => moment(a.date).diff(moment(b.date)));;
  console.log("here", rows)


  const summary = [
    {format: 'usd', label: 'Profit', value: rows.reduce((a,c) => a + c.nto_profit, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'nto_amount', label:'Original NTO', format:'usd'},
      {key:'updated_nto', label:'Final NTO', format:'usd'}, 
      {key:"nto_profit", label:'Profit', format:'usd'}, 
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}
