import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import moment from 'moment/moment';


export default function Funding(props) {
  let { rows } = props;
  rows = rows.map(x => ({
    ...x, 
    total: x.invoice.total,
    difference: Math.round(100*(x.invoice.total - x.deposits))/100
  }))
  .filter(x => x.difference !== 0).sort((a, b) => moment(a.date).diff(moment(b.date)));;

  const summary = [
    {format: 'usd', label: 'Owed', value: rows.reduce((a,c) => a + c.total, 0)},
    {format: 'usd', label: 'Collected', value: rows.reduce((a,c) => a + c.deposits, 0)},
    {format: 'usd', label: 'Difference', value: rows.reduce((a,c) => a + c.difference, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Sale Date'},
      {key:'customerName', label:'Customer'}, 
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'total', label:'Invoice Balance', format:'usd'},
      {key:'deposits', label:'Deposits', format:'usd'}, 
      {key:'difference', label:'Amount Owed', format:'usd'}, 
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