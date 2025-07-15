import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { StateManager } from '../../utilities/stateManager';
import moment from 'moment/moment';


export default function Deals(props) {
  let { rows, filter = () => null } = props;
  rows = rows.filter(filter).sort((a, b) => moment(a.date).diff(moment(b.date)));;

  const profit_type = StateManager.isManager() ? "profit" : "protected_profit";
  const cogs_type = StateManager.isManager() ? "cogs" : "protected_cogs";

  const summary = [
    {format: 'usd', label: 'Revenue', value: rows.reduce((a,c) => a + c.revenue, 0)},
    {format: 'usd', label: 'COGS', value: rows.reduce((a,c) => a + c[cogs_type], 0)},
    {format: 'usd', label: 'Gross Margin', value: rows.reduce((a,c) => a + c[profit_type], 0)},
    {format: 'usd', label: 'Receivables', value: rows.reduce((a,c) => a + (c.invoice.total - c.deposits), 0)},
    {format: 'usd', label: 'Payables', value: rows.reduce((a,c) => a + c.unpaid, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'revenue', label:'Revenue', format:'usd'},
      {key:'deposits', label:'Deposits', format:'usd'}, 
      {key:cogs_type, label:'Cost', format:'usd'}, 
      {key:'unpaid', label:'Unpaid Cost', format:'usd'}, 
      {key:profit_type, label:'Profit', format:'usd'}, 
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} summaryTop/>
      </Grid>
    </Grid>
  );
}
