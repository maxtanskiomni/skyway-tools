import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import moment from 'moment';
import { StateManager } from "../../utilities/stateManager";


export default function Inventory(props) {
  const { data = {} } = props;
  const { orders = [] } = data;

  let rows = orders.filter(x => x.invested_cost > 0).sort((a,b) => new Date(a.date || '1/1/2021') - new Date(b.date || '1/1/2021'));

  const summary = [
    {format: 'usd', label: 'Net Receivables', value: rows.reduce((a,c) => a + (c.receivable || 0), 0)},
    {format: 'usd', label: 'Purchases Value', value: rows.reduce((a,c) => a + (c.purchase_value || 0), 0)},
    {format: 'usd', label: 'Labor Value', value: rows.reduce((a,c) => a + (c.labor_value || 0), 0)},
    {format: 'usd', label: 'Total Investment', value: rows.reduce((a,c) => a + (c.invested_cost || 0), 0)},
    {format: 'usd', label: 'Net Inventory Value', value: rows.reduce((a,c) => a + (c.net_inventory || 0), 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      // {key:'number', label:'Number'},
      {key:'date', label:'Date'}, 
      {key:'id', label:'Order'}, 
      {key:'car', label:'Car'},
      {key:'status', label:'Status'}, 
      {key:'labor_value', label:'Labor Value', format:'usd'}, 
      {key:'purchase_value', label:'Parts Value', format:'usd'}, 
      {key:'invested_cost', label:'Investment Value', format:'usd'}, 
      {key:'net_inventory', label:'Inventory Value', format:'usd'}, 
      {key:'receivable', label:'Receivable', format:'usd'}, 
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
