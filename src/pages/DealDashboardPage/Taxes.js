import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';

export default function Taxes(props) {
  let { rows } = props;
  rows = rows.map(x => ({...x, ...x.invoice}));

  const summary = [
    {format: 'usd', label: 'Sales', value: rows.reduce((a,c) => a + c.sales, 0)},
    {format: 'usd', label: 'Exemptions', value: rows.reduce((a,c) => a + c.exemption, 0)},
    {format: 'usd', label: 'Sales Tax', value: rows.reduce((a,c) => a + c.salesTax, 0)},
    {format: 'usd', label: 'Surtax', value: rows.reduce((a,c) => a + c.surtax, 0)},
    {format: 'usd', label: 'Excess', value: rows.reduce((a,c) => a + c.excess, 0)},
    {format: 'usd', label: 'Total Due', value: rows.reduce((a,c) => a + c.salesTax + c.surtax, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'sales', label:'Sales', format:'usd'},
      {key:'exemption', label:'Exemptions', format:'usd'},
      {key:'excess', label:'5k Excess', format:'usd'}, 
      {key:'surtax', label:'Surtax', format:'usd'},
      {key:'salesTax', label:'Sales Tax', format:'usd'}, 
      {key:'state', label:'State'}, 
      {key:'tax_rate', label:'Effective Percent'}, 
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

