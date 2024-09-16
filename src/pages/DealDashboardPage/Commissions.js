import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';

export default function Commissions(props) {
  const { rows } = props;

  const reps = [...new Set(rows.map(deal => deal.sales_rep))].map(rep => rep || "Unassigned");
  const summary = [
    ...reps.map( rep => {
      return {
          format: 'usd', 
          label: rep+" Margin:", 
          value: rows.filter(deal => (deal.sales_rep || "Unassigned") === rep).reduce((a,c) => a + c.protected_profit, 0),
      };
    }),
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'},
      {key:'sales_rep', label:'Sales Rep'}, 
      {key:'protected_profit', label:'Margin', format:'usd'},
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

