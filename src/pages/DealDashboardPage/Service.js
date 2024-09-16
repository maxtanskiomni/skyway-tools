import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { Button } from '@mui/material';
import firebase from '../../utilities/firebase';
import constants from '../../utilities/constants';
import moment from 'moment';
import history from '../../utilities/history';


export default function Service(props) {
  let { orders = [], filter = () => true, stockNumber } = props;
  let rows = orders.filter(filter);

  // Step 1: Sum values for each writer
  const sumsByWriter = rows.reduce((acc, order) => {
    // Assuming 'order.value' is the property holding the value to be summed
    // and 'order.writer' is the identifier for each writer
    const writer = (order.writer || "Unassigned").toUpperCase();
    if (acc[writer]) {
      acc[writer] += order.revenue; // Sum values for the same writer
    } else {
      acc[writer] = order.revenue; // Initialize if first occurrence
    }
    return acc;
  }, {});

  // Step 2: Transform the sums into the desired format
  const writerSummary = Object.entries(sumsByWriter).map(([writer, value]) => {
    const originalWriterLabel = rows.find(order => (order.writer || "Unassigned").toUpperCase() === writer).writer || "Unassigned";
    return { label: originalWriterLabel, value, format:"usd" };
  })

  const summary = [
    {label: 'Revenue', value: rows.reduce((a,c) => a + c.revenue, 0), format:"usd"},
    {label: 'Cost', value: rows.reduce((a,c) => a + c.cost, 0), format:"usd"},
    {label: 'Profit', value: rows.reduce((a,c) => a + (c.revenue - c.cost), 0), format:"usd"},
    // {label: 'Deposits', value: rows.reduce((a,c) => a + c.deposits, 0), format:"usd"},
    {label: 'Receivables', value: rows.reduce((a,c) => a + (c.revenue - c.deposits), 0), format:"usd"},
    {label: 'Internal Transfers', value: rows.filter(x => x.customer === "Skyway Classics").reduce((a,c) => a + c.revenue, 0), format:"usd"},
    ...writerSummary
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'stock', label:'Service Order'},
      {key:'writer', label:'Service Writer'},
      {key:'customer', label:'Customer'},
      {key:'car', label:'Car'}, 
      {key:'status', label:'Status'}, 
      {key:'revenue', label:'Revenue', format:"usd"},
      {key:'cost', label:'Cost', format:"usd"}, 
      {key:'profit', label:'Profit', format:"usd"}, 
      {key:'receivable', label:'Amount Owed', format:"usd"}, 
    ],
    title: '', 
  };

  const makeService = async (params = {}) => {
    const counters = await firebase.firestore().doc('admin/counters').get();
    const new_stock = counters.data().lastOrder + 1;
    
    await firebase.firestore().doc('orders/'+`SO${new_stock}`).set({
      status: constants.service_statuses[0],
      date: moment().format('YYYY/MM/DD'),
      status_time: moment().format('YYYY/MM/DD'),
      stock: `SO${new_stock}`,
      car: stockNumber,
    });

    history.push(`/service-order/SO${new_stock}`);

    await firebase.firestore().doc('admin/counters').update({lastOrder: new_stock});
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}
