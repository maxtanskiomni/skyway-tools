import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Checks from './Checks.js';
import Outstandings from './Outstandings.js';
import Deposits from './Deposits.js';
import Payables from './Payables.js';
// import Recievables from './Recievables.js';
import Cash from './Cash.js';
import Inventory from './Inventory.js';
import ServiceInventory from './ServiceInventory.js';
import Summary from './Summary.js';
import Settings from './Settings.js';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import history from '../../utilities/history';
import moment from 'moment';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js';
import Accounts from './Accounts.js';


export default function AcountingPage(props) {
  const [data, setData] = React.useState({});
  const [reload, setReload] = React.useState(true);
  StateManager.reload = () => setReload(!reload);

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const {silent = false} = input;
  
      let new_data = {};
      const db = firebase.firestore();

      //Summary Account data
      db.doc('admin/counters').get()
        .then(summarySnapshot => {
          new_data.summary = summarySnapshot.data();
          new_data.summary_loaded = true;
          setData({...new_data});
        })

      //Accounts data
      const updatePlaid = async () => {
        new_data.accounts_loaded = false;
        db.collection('plaid_accounts').where("owner", "==", StateManager.orgID).get()
          .then(async snapshot => {
            new_data.accounts = snapshot.docs.map(getDocData);
            new_data.accounts_loaded = true;
            setData({...new_data});
          });
      }
      updatePlaid();
      StateManager.updatePlaid = updatePlaid

      

      //Cash data
      db.collection('cash').get()
        .then(async cashSnapshot => {
          new_data.cash = cashSnapshot.docs.map(getDocData);
          new_data.cash_loaded = true;
          const cashBalance = new_data.cash.reduce((a,c) => a + c.amount, 0);
          await db.doc("admin/counters").set({cashBalance}, {merge: true});
          setData({...new_data});
        })

      //Check data
      db.collection('checks').where('status', '==', 'pending').get()
        .then(oustandingSnapshot => {
          new_data.outstanding_checks = oustandingSnapshot.docs.map(getDocData);
          new_data.checks_loaded = true;
          setData({...new_data});
        })

      //Check data
      db.collection('deposits')
        .where('date', '>=', moment().subtract(6, "months").format("YYYY/MM/DD"))
        .get()
        .then(async depositsSnapshot => {
          new_data.deposits = depositsSnapshot.docs.map(getDocData);
          // new_data.deposits = new_data.deposits.filter(x => x.type === "sales");

          let cars = new_data.deposits.map(async (d, i) => {
            let car = await db.doc('cars/'+d.stock).get();
            car = car.data();
            car = !!car ? `${car.year || ""} ${car.make || ""} ${car.model || ""}` : d.stock ;
            new_data.deposits[i].car = car;
          });
          await Promise.all(cars);


          new_data.deposits_loaded = true;
          setData({...new_data});
        })

      //Inventory data
      db.collection('cars').where('status', '!=', "sold").get()
        .then(invSnap => {
          new_data.inventory = invSnap.docs.map(getDocData).filter(x => x.status !== "terminated")
                                                          // .filter(x => x.status !== "success")
                                                          .filter(x => x.status !== "admin review");

          const inventoryPromises = new_data.inventory.map(async car => {
            const payableSnap = await db.collection('purchases').where('stock', '==', car.id).get();
            const value = payableSnap.docs.map(doc => doc.data())
                                          .filter(x => !x.isPayable)
                                          .reduce((a,c) => a + c.amount, 0);
            car.value = value;
            car.title = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
            car.market_price = car.pricing?.excellent || "-";
          });

          Promise.all(inventoryPromises).then(() =>{
            new_data.inventory_loaded = true;
            setData({...new_data})
          });
        })

      //Service data
      db.collection('orders')
        .where('status', '!=', "complete")
        .get()
        .then(async snapshot => {
          new_data.orders = snapshot.docs.map(getDocData).filter(x => x.status !== "deleted");

          let accounting_queries = new_data.orders.map(async (d, i) => {
            let deposits = await db.collection(`deposits`).where("stock", "==", d.id).get();
            deposits = deposits.docs.map(doc => ({...doc.data(), id: doc.id}));
            deposits = deposits.reduce((a,c) => a + (c.amount || 0), 0);

            let car = await db.doc(`cars/${d.car || null}`).get();
            car = car.exists ? car.data() : {};
            car = `${car.year || ''} ${car.make || ''} ${car.model || ''}`;

            let services = await db.collection("services").where("order", "==", d.id).get();
            services = services.docs.map(getDocData).filter(s => s.status === "complete");

            let expenses = await db.collection("purchases").where("stock", "==", d.id).get();
            expenses = expenses.docs.map(getDocData).filter(e => !e.isPayable);
          
            const revenue = d.revenue || 0;
            const labor_value = services.reduce((a,c) => a + (c.cost || 0), 0);
            const purchase_value = expenses.reduce((a,c) => a + (c.amount || 0), 0);
            const invested_cost = labor_value + purchase_value;
            const net_inventory = invested_cost - deposits;

            const financials = {
              car,
              revenue,
              deposits,
              invested_cost,
              purchase_value,
              labor_value, 
              net_inventory,
              receivable: revenue - deposits,
              rowLink: `/service-order/${d.id}`,
              type: "service",
            };

            new_data.orders[i] = {...new_data.orders[i], ...financials};
          });
          await Promise.all(accounting_queries);

          new_data.orders_loaded = true;
          setData({...new_data});
        });
      



      //Payable data
      const payableSnapshot = await db.collection('purchases').where('isPayable', '==', true).get();
      new_data.payables = payableSnapshot.docs.map(getDocData).filter(x => !["Skyway Classics"].includes(x.vendor));
      const getIssNTO = x => (x.id || "").includes("NTO") || (x.memo || "").includes("NTO")
      new_data.payables = new_data.payables.map(x => ({...x, isNTO: getIssNTO(x)}));

      const payablePromises =  new_data.payables.map(async payable => {
        if(!!payable.stock){
          const dealSnap = await db.collection('deals').doc(payable.stock).get();
          payable.deal = dealSnap.exists ? dealSnap.data() : {};
          const deal = payable.deal;

          let invoice = {};
          if(!!deal.invoice) {
            const invoiceSnap = await db.doc('invoices/'+deal.invoice).get();
            payable.invoice = invoiceSnap.exists ? invoiceSnap.data() : {};
            invoice = payable.invoice;

            const depositSnap = await db.collection('deposits').where('stock', '==', payable.stock).get();
            payable.deposits = depositSnap.docs.map(getDocData);
            const totalDeposits = payable.deposits.map(x => x.amount || 0).reduce((a,c) => a + c, 0);
            payable.isFunded = totalDeposits >= (invoice.total || 0) * 0.9;
          }

          const carSnap = await db.doc("cars/"+payable.stock).get();
          const carData = carSnap.data() || {};
          payable.car = `${payable.stock || ""} ${carData.year || ""} ${carData.make || ""} ${carData.model || ""}`;
          payable.isSold = carData.status === "sold";// || carData.stats === "success";
        }
      });
      Promise.all(payablePromises).then(() => {
        new_data.payables_loaded = true
        setData({...new_data})
      });

      //Funding data
      new_data.funding = [];
      let current_period = moment();
      const periods = [...Array(12).keys()];
      const months = periods.map(x => {
        let month = current_period.format("YYYY-MM");
        current_period = current_period.subtract(1, "month");
        return month;
      });

      let fundingPromises = months.map(async (month, i) => {
        const dealSnap = await db.collection('deals').where('month', '==', month).get();
        const dealPromises = dealSnap.docs.map(async deal => {
          deal = {id: deal.id, ...deal.data()};
          let invoice = await db.doc('invoices/'+deal.invoice).get();
          invoice = invoice.exists ? invoice.data() : {};
          let deposits = await db.collection('deposits').where('stock', '==', deal.id).get();//.where("date", "<=", "2023/12/31").get();
          deposits = deposits.docs.map(doc => doc.data().amount || 0).reduce((a,c) => a + c, 0);
          const amountOutstanding = (invoice.total || 0) - deposits > 0 ? (invoice.total || 0) - deposits : 0;
          return {car: deal.id, amount: amountOutstanding};
        });
        const deals = await Promise.all(dealPromises)
        new_data.funding[i] = {month, deals};
        return deals;
      });
      fundingPromises = await Promise.all(fundingPromises);
      fundingPromises = fundingPromises.flat();
      Promise.all(fundingPromises).then(() => {
        new_data.funding_loaded = true;
        setData({...new_data})
      });

    }
    fetchData();
    StateManager.updateData = fetchData;
  }, [reload]);

  let sections = {
    'summary': {component: <Summary data={data} />, condition: data.summary_loaded && data.payables_loaded && data.orders_loaded},
    'deposits': {component: <Deposits data={data} />, condition: data.deposits_loaded},
    // 'recievables': (i) => <Recievables />,
    'payables': {component: <Payables data={data} />, condition: data.payables_loaded},
    // 'new-checks': (i) => <Checks data={data} />,
    'checks-outstanding': {component: <Outstandings data={data} />, condition: data.checks_loaded},
    'cash-management': {component: <Cash data={data} />, condition: data.cash_loaded},
    'inventory': {component: <Inventory data={data} />, condition: data.inventory_loaded},
    'service-inventory': {component: <ServiceInventory data={data} />, condition: data.orders_loaded},
    //'new-deposits': (i) => <Deposits />,
  };

  if(StateManager.isAdmin) sections.settings = {component: <Settings data={data} />, condition: data.summary_loaded};
  if(StateManager.isAdmin) sections.accounts = {component: <Accounts data={data} />, condition: data.accounts_loaded};

  const defaultKey = new URL(window.location.href).searchParams.get("tab");
  const defaultIndex = Math.max(Object.keys(sections).indexOf(defaultKey), 0);
  StateManager.setTitle("Accounting Dashboard");

  const updateURL = (index) => {
    index = Object.keys(sections)[index]
    const url = new URL(window.location.href);
    let params = url.pathname
    if(url.search === '') params += "?tab="+index;
    else if(url.search.indexOf('tab=') < 0) params += url.search + "&tab="+index;
    else params += url.search.replace(/tab=.*[^&]/g, "tab="+index);
    history.replace(params)
  }

  return (
    <>
      <Tabs defaultIndex={defaultIndex} onSelect={updateURL}>
        <TabList>
          { Object.keys(sections).map((section, i) => <Tab>{formatTitle(section)}</Tab>) }
        </TabList>
        { Object.values(sections).map((panel, i) => <TabPanel>{panel.condition ? panel.component : <Loading />}</TabPanel>) }
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
  return {...doc.data(), id: doc.id}
}

const Loading = (props) =>  (
  <Paper>
    <div>
      <CircularProgress color="primary" />
    </div>
  </Paper>
);