import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { Button } from '@mui/material';
import firebase from '../../utilities/firebase';
import constants from '../../utilities/constants';
import moment from 'moment';
import history from '../../utilities/history';


export default function Services(props) {
  let { orders = [], filter = () => true, stockNumber, thumbnail = null } = props;
  let rows = orders.filter(filter);
  console.log(rows)

  const summary = [
    {label: 'Revenue', value: rows.reduce((a,c) => a + c.revenue, 0), format:"usd"},
    // {label: 'Cost', value: rows.reduce((a,c) => a + c.cost, 0), format:"usd"},
    // {label: 'Profit', value: rows.reduce((a,c) => a + (c.revenue - c.cost), 0), format:"usd"},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'stock', label:'Service Order'}, 
      {key:'status', label:'Status'}, 
      // {key:'cost', label:'Cost', format:"usd"}, 
      {key:'revenue', label:'Revenue', format:"usd"}, 
    ],
    title: '', 
  };
  const active_orders = rows.filter(row => !["payment", "complete"].includes(row.status));

  const makeService = async (params = {}) => {

    //Open the active order first before making a new one.
    if(active_orders.length > 0){
      const active_order = active_orders.at(-1);
      history.push(`/service-order/${active_order.stock}`);
      return;
    }
    

    const counters = await firebase.firestore().doc('admin/counters').get();
    const new_stock = counters.data().lastOrder + 1;
    
    await firebase.firestore().doc('orders/'+`SO${new_stock}`).set({
      status: "working", //constants.service_statuses[0],
      date: moment().format('YYYY/MM/DD'),
      status_time: moment().format('YYYY/MM/DD'),
      stock: `SO${new_stock}`,
      car: stockNumber,
      thumbnail: thumbnail,
    });

    history.push(`/service-order/SO${new_stock}`);

    await firebase.firestore().doc('admin/counters').update({lastOrder: new_stock});
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
      <Grid item xs={12} style={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={makeService}>
          {active_orders.length > 0 ? "Open active SO" : "Create Service Order"}
        </Button>
      </Grid>
    </Grid>
  );
}
