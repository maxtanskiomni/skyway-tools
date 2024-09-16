import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';


export default function Payables(props) {
  let { rows } = props;
  const payables = rows.filter(x => x.type === "deal" && x.payables > 0).sort((a,b) => +b.stock.replace(/-.+/, "") - a.stock.replace(/-.+/, ""));
  const paid = rows.filter(x => x.type === "paid").sort((a,b) => +b.stock.replace(/-.+/, "") - a.stock.replace(/-.+/, ""));
  rows = [...payables, ...paid];

  const summary = [
    {format: 'usd', label: 'Additional NTOs', value: rows.reduce((a,c) => a + (c.payables || 0), 0)},
    {format: 'usd', label: 'NTOs Paid', value: rows.reduce((a,c) => a + (c.paid || 0), 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'date', label:'Date'},
      {key:'stock', label:'Stock Number'},
      {key:'payables', label:'Additional Payables', format:'usd'},
      {key:'paid', label:'Reduced Payables', format:'usd'}, 
    ],
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

