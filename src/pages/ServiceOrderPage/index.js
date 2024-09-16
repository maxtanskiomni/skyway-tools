import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Files from './Files.js';
import Summary from './Summary.js';
import Notes from './Notes.js';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';


import { StateManager } from '../../utilities/stateManager.js';

import algolia from '../../utilities/algolia';
import Items from './Items.js';
import constants from '../../utilities/constants.js';

const tab = new URL(window.location.href).searchParams.get("tab");

export default function ServiceOrderPage(props) {
  const { stockNumber } = props.match.params;
  const [order, setOrder] = React.useState({});
  StateManager.setOrder = setOrder;
  StateManager.updateCar = data => setOrder({...order, ...data});
  StateManager.setTitle(`${stockNumber}`);

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const db = firebase.firestore();
      const doc = await db.doc('orders/'+stockNumber).get();
      if(doc.exists){
        let data = doc.data();
        StateManager.setTitle(`${stockNumber} ${data.description || ""}`);
        data.disabled = !StateManager.isAdmin() && data.status === constants.order_statuses.at(-1);
        data.order_loaded = true;
        setOrder({...data});
        data.updater = setOrder;

        // db.doc('inspections/'+stockNumber).get()
        //   .then((snap) => {
        //     data.inspection = snap.data() || {};
        //     data.inspection_loaded = true;
        //     setOrder({...data});
        //   });

        db.collection('parts').where('order', '==', stockNumber).get()
          .then((partsSnap) => {
            const parts = partsSnap.docs.map(getDocData);
            data.parts = parts;
            data.parts_loaded = true;
            setOrder({...data});
          });

        db.collection('subcontracts').where('order', '==', stockNumber).get()
          .then((snap) => {
            const subs = snap.docs.map(getDocData);
            data.subcontracts = subs;
            data.subs_loaded = true;
            setOrder({...data});
          });

        db.collection('services').where('order', '==', stockNumber).get()
          .then((servicesSnap) => {
            const services = servicesSnap.docs.map(getDocData);
            data.services = services;
            data.services_loaded = true;
            setOrder({...data});
          });

        db.collection('files').where('stock', '==', stockNumber).get()
          .then((fileSnap) => {
            data.files = fileSnap.docs.map(getDocData);
            data.files_loaded = true;
            setOrder({...data});
          });

        if(data.customer){
          db.doc('customers/'+data.customer).get()
          .then((cust_data) => {
            data.customer = {...cust_data.data(), id: data.customer};
            data.customer.display_name = `${data.customer.first_name} ${data.customer.last_name}`;
            data.customer_loaded = true;
            setOrder({...data});
          });
        }else{
          data.customer_loaded = true;
        }

        if(data.car){
          db.doc('cars/'+data.car).get()
          .then((car_data) => {
            data.car = {...car_data.data(), id: data.car};
            data.car.title = `${data.car.stock || ""} ${data.car.year || ""} ${data.car.make || ""} ${data.car.model || ""}`;
            data.car_loaded = true;
            setOrder({...data});
          });
        }else{
          data.car_loaded = true;
        }

        db.collection('deposits').where('stock', '==', stockNumber).get()
        .then((transactionSnapshot) => {
          data.deposits = transactionSnapshot.docs.map(getDocData).filter(x => x.type === "service");
          console.log(data.deposits);
          data.deposits_loaded = true;
          setOrder({...data});
        });


        db.collection('purchases').where('stock', '==', stockNumber).get()
          .then((expenseSnap) => {
            data.expenses = expenseSnap.docs.map(getDocData);
            data.expenses_loaded = true;
            setOrder({...data});
          });

        db.collection('files').where('stock', '==', stockNumber).get()
          .then((fileSnap) => {
            data.files = fileSnap.docs.map(getDocData);
            data.files_loaded = true;
            setOrder({...data});
          });

      } else {
        setOrder({stock: stockNumber, updater: setOrder});
        firebase.firestore().doc('orders/'+stockNumber).set({stock: stockNumber}, {merge: true});
        await algolia.createRecord("orders", {objectID: stockNumber, ...{stock: stockNumber}})
      }
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [stockNumber]);
  

  const tabs = {
    'summary':  {component: <Summary order={order} updater={setOrder} disabled={order.disabled} />, condition: order.order_loaded && order.customer_loaded && order.expenses_loaded && order.car_loaded && order.deposits_loaded},
    // 'inspection':  {component: <Inspection car={order} updater={setOrder}/>, condition: order.inspection_loaded},
    'services':  {component: <Items items={order.services} stockNumber={stockNumber} type="services" disabled={order.disabled} showSummary/>, condition: order.services_loaded},
    'parts':  {component: <Items items={order.parts} stockNumber={stockNumber} type="parts" disabled={order.disabled} showSummary />, condition: order.parts_loaded},
    // 'subcontracts':  {component: <Items items={order.subcontracts} stockNumber={stockNumber} type="subcontracts" showSummary/>, condition: order.subs_loaded},
    'purchases':  {component: <Items items={order.expenses} stockNumber={stockNumber} type="expenses" showSummary/>, condition: order.expenses_loaded},
    'files':   {component: <Files order={order}/>, condition: order.files_loaded},
    'notes':  {component: <Notes order={order}/>, condition: order.order_loaded},
  };

  const defaultKey = new URL(window.location.href).searchParams.get("tab");
  const defaultIndex = Math.max(Object.keys(tabs).indexOf(defaultKey), 0);

  const updateURL = (index) => {
    index = Object.keys(tabs)[index]
    const url = new URL(window.location.href);
    let params = url.pathname;
    if(url.search === '') params += "?tab="+index;
    else if(url.search.indexOf('tab=') < 0) params += url.search + "&tab="+index;
    else params += url.search.replace(/tab=.*[^&]/g, "tab="+index);
    history.replace(params);
    StateManager.setTitle(`${StateManager.title.split(" - ").at(0)} - ${index}`);
  }

  return (
    <>
      <Tabs defaultIndex={+defaultIndex} onSelect={updateURL}>
        <TabList>
          { Object.keys(tabs).map((section, i) => <Tab>{formatTitle(section)}</Tab>) }
        </TabList>
          { Object.values(tabs).map((panel, i) => <TabPanel>{panel.condition ? panel.component : <Loading />}</TabPanel> )}
      </Tabs>
    </>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const getDocData = doc => {
  return {id: doc.id, ...doc.data()}
}

const Loading = (props) =>  (
  <Paper>
    <div>
      <CircularProgress color="primary" />
    </div>
  </Paper>
);