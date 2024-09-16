import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Checklist from './Checklist.js';
import Expenses from './Transactions.js';
import Pricing from './Pricing.js';
import Sales from './Sales.js';
import Funding from './Funding.js';
import Files from './Files.js';
import Title from './Title.js';
import Leads from './Leads.js';
import Marketing from './Marketing.js';
import CarSummary from './CarSummary.js';
import Service from './Service.js';
import Finance from './Finance.js';
import DMVSummary from './DMVSummary.js';
import FileBank from './FileBank.js';
import Paperwork from './Paperwork.js';
import Notes from './Notes.js';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import Preview from '../../components/Preview.js';
import DMV from './DMV.js';
import Repairs from './Repairs.js';
import Consignor from './Consignor.js';
import Shipping from './Shipping.js';
import ShippingIn from "./ShippingIn.js"
import Inspection from './Inspection';
import Checkin from './Checkin.js';
import { StateManager } from '../../utilities/stateManager.js';

import algolia from '../../utilities/algolia';
import Transactions from './Transactions.js';
import Writeup from './Writeup.js';

const tab = new URL(window.location.href).searchParams.get("tab");

export default function CarPage(props) {
  const { stockNumber } = props.match.params;
  const [car, setCar] = React.useState({});
  StateManager.setCar = setCar;
  StateManager.updateCar = data => setCar({...car, ...data});
  // StateManager.setTitle(`${stockNumber}`);

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const db = firebase.firestore();
      const doc = await db.doc('cars/'+stockNumber).get();
      if(doc.exists){
        let data = doc.data();
        StateManager.setTitle(`${stockNumber} ${data.year || ""} ${data.make || ""} ${data.model || ""}`);
        data.car_loaded = true;
        setCar({...data});
        data.updater = setCar;

        data.car_loaded = true;

        db.doc('inspections/'+stockNumber).get()
          .then((snap) => {
            data.inspection = snap.data() || {};
            data.inspection_loaded = true;
            setCar({...data});
          });

        db.collection('invoices').where('stock', '==', stockNumber).get()
          .then((invoiceSnap) => {
            const [shipping, fail] = invoiceSnap.docs.map(getDocData).partition(x => x.type === "shipping");
            const [shipping_in, others] = invoiceSnap.docs.map(getDocData).partition(x => x.type === "shipping_in");
            const [finance, regular] = fail.partition(x => x.type === "finance");
            data.invoices = regular.filter(x => !["shipping_in"].includes(x.type));;
            data.shipping_invoices = shipping;
            data.shipping_in_invoices = shipping_in;
            data.finance_invoices = finance;
            data.invoices_loaded = true;
            setCar({...data});
          });

        db.collection('deposits').where('stock', '==', stockNumber).get()
          .then((transactionSnapshot) => {
            const [shipping, fail] = transactionSnapshot.docs.map(getDocData).partition(x => x.type === "shipping");
            const [shipping_in, others] = transactionSnapshot.docs.map(getDocData).partition(x => x.type === "shipping_in");
            const [finance, regular] = fail.partition(x => x.type === "finance");
            data.deposits = regular.filter(x => !["shipping_in"].includes(x.type));;
            data.shipping_deposits = shipping;
            data.shipping_in_deposits = shipping_in;
            data.finance_deposits = finance;
            data.deposits_loaded = true;
            setCar({...data});
          });

        db.collection('purchases').where('stock', '==', stockNumber).get()
          .then((expenseSnap) => {
            const [pass, fail] = expenseSnap.docs.map(getDocData).partition(x => x.type === "shipping");
            const [shipping_in, others] = expenseSnap.docs.map(getDocData).partition(x => x.type === "shipping_in");
            data.expenses = fail.filter(x => !["shipping_in"].includes(x.type));
            data.shipping_expenses = pass;
            data.shipping_in_expenses = shipping_in;
            data.expenses_loaded = true;
            setCar({...data});
          });

        db.collection('repairs').where('stock', '==', stockNumber).get()
          .then((repairSnap) => {
            data.repairs = repairSnap.docs.map(getDocData);
            data.repairs_loaded = true;
            setCar({...data});
          });

        db.collection('leads').where('stock', '==', stockNumber).get()
        .then((leadSnap) => {
          data.leads = leadSnap.docs.map(getDocData).map(lead => ({...lead, rowLink: `/lead/${lead.id}`}));
          data.leads_loaded = true;
          setCar({...data});
        });

        db.collection('files').where('stock', '==', stockNumber).get()
          .then((fileSnap) => {
            data.files = fileSnap.docs.map(getDocData);
            data.files_loaded = true;
            setCar({...data});
          });

        db.collection('orders').where('car', '==', stockNumber).get()
          .then(async (fileSnap) => {
            data.orders = fileSnap.docs.map(getDocData);
            const servicePromises = data.orders.map(order => db.collection('services').where('order', '==', order.id).get());
            const servicesSnaps = await Promise.all(servicePromises);
            const services = servicesSnaps.map(servicesSnap => servicesSnap.docs.map(getDocData) ).flat();

            const partPromises = data.orders.map(order => db.collection('parts').where('order', '==', order.id).get());
            const partsSnaps = await Promise.all(partPromises);
            const parts = partsSnaps.map(partsSnap => partsSnap.docs.map(getDocData) ).flat();

            const subPromises = data.orders.map(order => db.collection('subcontracts').where('order', '==', order.id).get());
            const subSnaps = await Promise.all(subPromises);
            const subs = subSnaps.map(subSnap => subSnap.docs.map(getDocData) ).flat();

            data.orders.forEach((order, i) => {
              const filteredServices = services.filter(x => x.order === order.id);
              const filteredParts = parts.filter(x => x.order === order.id);
              const filteredSubs = subs.filter(x => x.order === order.id);
          
              // data.orders[i].revenue = filteredServices.reduce((a,c) => a + c.revenue || 0, 0) + filteredParts.reduce((a,c) => a + c.revenue || 0, 0) + filteredSubs.reduce((a,c) => a + c.revenue || 0, 0);
              data.orders[i].cost = filteredServices.reduce((a,c) => a + c.cost || 0, 0) + filteredParts.reduce((a,c) => a + c.cost || 0, 0) + filteredSubs.reduce((a,c) => a + c.cost || 0, 0);
              data.orders[i].rowLink = `../service-order/${order.id}`;
            });
            data.orders_loaded = true;
            setCar({...data});
          });

        db.doc('titles/'+stockNumber).get()
          .then((titleSnap) => {
            data.title = {...titleSnap.data(), id: titleSnap.id};
            data.title_loaded = true;
            setCar({...data});
          });

        db.doc('deals/'+stockNumber).get()
          .then((dealSnap) => {
            data.deal = dealSnap.data() || {};
            data.deal_loaded = true;
            setCar({...data});
          })
          .then(() =>{
            const customers = [
              {type: "consignor", id: data.consignor},
              {type: "buyer", id: data.deal.buyer},
              {type: "cobuyer", id: data.deal.cobuyer}
            ]
            
            customers.forEach(customer => {
              const {type} = customer;
              if(!customer.id){
                data[type] = {};
                data[`${type}_loaded`] = true;
                setCar({...data});
                return;
              }
    
              db.doc('customers/'+customer.id).get()
                .then((cust_data) => {
                  data[type] = {...cust_data.data(), id: customer.id} || {};
                  data[type].display_name = `${data[type].first_name || ""}${!!data[type].last_name ? " " : ""}${data[type].last_name || ""}`;
                  data[`${type}_loaded`] = true;
                  setCar({...data});
                });
            });
          });

      } else {
        setCar({stock: stockNumber, updater: setCar});
        firebase.firestore().doc('cars/'+stockNumber).set({stock: stockNumber}, {merge: true});
        await algolia.createRecord("cars", {objectID: stockNumber, ...{stock: stockNumber}})
      }
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [stockNumber]);
  

  const tabs = {
    'summary':  {component: <CarSummary car={car} updater={setCar}/>, condition: car.car_loaded},
    'Checkin':  {component: <Checkin car={car} updater={setCar}/>, condition: car.inspection_loaded},
    'inspection':  {component: <Inspection car={car} updater={setCar}/>, condition: car.inspection_loaded},
    'service':  {component: <Service orders={car.orders} stockNumber={stockNumber} thumbnail={car.thumbnail} />, condition: car.car_loaded && car.orders_loaded},
    'marketing': {component: <Marketing car={car}/>, condition: car.car_loaded}, 
    'writeup': {component: <Writeup car={car}/>, condition: car.car_loaded}, 
    'consignment':   {component: <Consignor car={car}/>, condition: car.consignor_loaded},
    'leads':  {component: <Leads {...car} />, condition: car.leads_loaded},
    'sales':   {component: <Sales car={car}/>, condition: car.deal_loaded && car.buyer_loaded && car.cobuyer_loaded && car.deposits_loaded && car.expenses_loaded},
    'finance':   {component: <Finance car={car}/>, condition: car.deal_loaded && car.buyer_loaded && car.cobuyer_loaded},
    'shipping-in':   {component: <ShippingIn car={car}/>, condition: car.deal_loaded && car.buyer_loaded && car.cobuyer_loaded && car.invoices_loaded},
    'shipping-out':   {component: <Shipping car={car}/>, condition: car.deal_loaded && car.buyer_loaded && car.cobuyer_loaded && car.invoices_loaded},
    'DMV':   {component: <DMV car={car}/>, condition: car.deal_loaded},
    'title':   {component: <Title car={car}/>, condition: car.deal_loaded && car.buyer_loaded},
    'files':   {component: <Files car={car}/>, condition: car.files_loaded},
    'notes':  {component: <Notes car={car}/>, condition: car.car_loaded},
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