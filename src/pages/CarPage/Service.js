import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { Button } from '@mui/material';
import firebase from '../../utilities/firebase';
import constants from '../../utilities/constants';
import moment from 'moment';
import history from '../../utilities/history';
import AddServiceOrderDialog from '../../components/AddServiceOrderDialog';

export default function Services(props) {
  let { orders = [], filter = () => true, stockNumber, thumbnail = null, car = {} } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  let rows = orders.filter(filter);
  console.log(car)

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


  const makeService2 = async (params = {}) => {
    setDialogOpen(true);
  }

  const handleDialogClose = () => {
    setDialogOpen(false);
  }

  const makeService = async (params = {}) => {

    //Open the active order first before making a new one.
    // if(active_orders.length > 0){
    //   const active_order = active_orders.at(-1);
    //   history.push(`/service-order/${active_order.stock}`);
    //   return;
    // }
    

    const counters = await firebase.firestore().doc('admin/counters').get();
    const new_stock = counters.data().lastOrder + 1;

    const customer = car?.consignor?.id === "4ed13115-1900-41d2-a14d-13f1242dd48a" ? "9c0d88f5-84f9-454d-833d-a8ced9adad49" : car?.consignor?.id || "9c0d88f5-84f9-454d-833d-a8ced9adad49";
    
    await firebase.firestore().doc('orders/'+`SO${new_stock}`).set({
      status: "estimate", //constants.service_statuses[0],
      customer,
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
        <Button variant="contained" color="primary" onClick={makeService2}>
          {/* {active_orders.length > 0 ? "Open active SO" : "Create Service Order"} */}
          Create Service Order
        </Button>
      </Grid>
      <AddServiceOrderDialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        initialCar={car ? {
          objectID: car.id,
          stock: stockNumber,
          year: car.year,
          make: car.make,
          model: car.model,
          trim: car.trim,
          thumbnail: thumbnail
        } : null}
      />
    </Grid>
  );
}
