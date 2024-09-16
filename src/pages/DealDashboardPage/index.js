import React from 'react';
import Grid from '@mui/material/Grid';
import Taxes from './Taxes.js';
import Deals from './Deals.js';
import NTOs from './NTOs.js';
import Funding from './Funding.js';
import Payables from './Payables.js';
import Commissions from './Commissions.js';
import DMV from './DMV.js';
import Finance from './Finance.js';
import DateLine from '../../components/DateLine';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import Trades from './Trades.js';
import Consignments from './Consignments.js';
import { StateManager } from "../../utilities/stateManager.js";
import Shipping from './Shipping.js';
import Service from './Service.js';
import SoldCars from './SoldCars.js';
import TextLine from '../../components/TextLine.js';
import constants from '../../utilities/constants.js';


let timeout = () => null;
export default function DealDashboard(props) {
  const { month } = props.match.params;
  const monthStart =  moment(month).startOf('month');
  const monthEnd = moment(month).endOf('month');

  const [payload, setPayload] = React.useState([]);
  StateManager.setTitle("Deals Dashboard - "+moment(month).format("MMM YYYY"));
  
  const [term, setTerm] = React.useState(StateManager.isBackoffice() ? "" : StateManager.userName);

  const updateTerm = (id, value) => {
    if(value === null) value = ""
    // setLoading(true);
    setTerm(value);
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      // setLoading(false);
    }, 1000);
    // setTerm(value);
  }

  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      const snaps = {
        deals: await db.collection('deals').where('month', '==', month).get(),
        shipping: await db.collection('deals').where('shipping_month', '==', month).get(),
        shipping_in: await db.collection('deals').where('shipping_in_month', '==', month).get(),
        finance: await db.collection('deals').where('month', '==', month).where("is_finance", "==", true).get(),
        service: await db.collection('orders')
          .where('complete_date', '>=', month)
          .where('complete_date', '<', moment(month).add(1, "month").format("YYYY-MM"))
          .get()
      }

      async function getDealData() {
        const promises = snaps["deals"].docs.map( 
          async (doc, i) => {
            //Deal data
            let data = doc.data();
            data.id = doc.id;
            data.stock = doc.id;
            data.type = "deal";
  
            //Car data
            const carSnap = await db.doc('cars/'+doc.id).get();
            data.car = carSnap.exists ? carSnap.data() : {};
            data.carTitle = `${data.car.year || ''} ${data.car.make || ''} ${data.car.model || ''}`;
            data.nto_amount = data.car.nto || 0;
            data.updated_nto = data.car.updated_nto || 0;
            data.nto_profit = data.nto_amount - data.updated_nto;
  
            //Funding data
            const invoiceSnap = await db.doc('invoices/'+data.invoice).get();
            data.invoice = invoiceSnap.exists ? invoiceSnap.data() : {};
            data.revenue = data.invoice.revenue || 0;
            const depositSnap = await db.collection('deposits').where('stock', '==', doc.id).get(); //.orderBy("date", 'desc')
            const [dep_pass, dep_fail_ship] = depositSnap.docs.map(snap => snap.data()).partition(x => x.type === "shipping");
            const [dep_pass_in, dep_fail] = dep_fail_ship.partition(x => x.type === "shipping_in");
            const [dep_finance, dep_regular] = dep_fail.partition(x => x.type === "finance");
            data.deposits = dep_regular.map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);
            const tradeSnap = await db.collection('trades').where('stock', '==', doc.id).get();
            data.trades = tradeSnap.docs.map(trade => trade.data());
  
            //Expense data
            const expenseSnap = await db.collection('purchases').where('stock', '==', doc.id).get(); //.orderBy("date", 'desc')
            const [pass, fail_ship] = expenseSnap.docs.map(snap => snap.data()).partition(x => x.type === "shipping");
            const [pass_in, fail] = fail_ship.partition(x => x.type === "shipping_in");
            const [finance, regular] = fail.partition(x => x.type === "finance");
            data.expenses = regular;
            data.cogs = data.expenses.map(expense => expense.amount).reduce((a,c) => a + c, 0);
            data.unpaid = data.expenses.filter(x => x.isPayable).reduce((a,c) => a + c.amount, 0);
            let nto = await db.doc('purchases/'+doc.id+"-NTO").get();
            data.nto = nto.exists ? nto.data() : {};
  
            //Tax data
            data.netTrade = tradeSnap.docs.map(trade => trade.data().trade).reduce((a,c) => a + c || 0, 0);
            data.sales = data.invoice.cashPrice + (data.invoice.docFee || 0);
            data.exemption = data.invoice.salesTax + data.invoice.surtax <= 0 ? data.sales : data.netTrade;
            data.basis = Math.max(0, data.sales - data.exemption);
            data.excess = Math.max(0, data.basis - 5000);
            data.tax_rate = (100 * (data.invoice.salesTax + data.invoice.surtax) / ((data.sales - data.netTrade) || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})+"%";
  
            //Payables data
            data.payables = data.expenses.filter(x => moment(x.paidDate).isAfter(monthEnd, 'month') || x.isPayable)
                                    .filter(x => (x.memo || "").includes("NTO"))
                                    .reduce((a,c) => a + c.amount, 0);
  
            //Misc data
            data.profit = data.revenue - data.cogs;
            const protected_factor = month <= "2024-04" ? 1.00 : 1.00;
            data.protected_cogs = data.cogs*protected_factor;
            data.protected_profit = Math.max(0, data.revenue - data.protected_cogs);
            data.ship_profit = data.ship_revenue - data.ship_cogs;
            data.rowLink = `../car/${data.stock}`;
  
            return data;
          }
        );
  
        let rows = await Promise.all(promises);
        return rows;
      }

      async function getData(params) {
        const {type} = params;
        const promises = snaps[type].docs.map( 
          async (doc, i) => {
            //Deal data
            let data = doc.data();
            data.id = doc.id;
            data.stock = doc.id;
            data.type = type;
  
            //Car data
            const carSnap = await db.doc('cars/'+doc.id).get();
            data.car = carSnap.exists ? carSnap.data() : {};
            data.carTitle = `${data.car.year || ''} ${data.car.make || ''} ${data.car.model || ''}`;
  
            //Funding data
            const invoiceSnap = await db.doc('invoices/'+data[type]).get();
            data.invoice = invoiceSnap.exists ? invoiceSnap.data() : {};
            data.revenue = data.invoice.price || 0;
            const depositSnap = await db.collection('deposits').where('stock', '==', doc.id).get(); //.orderBy("date", 'desc')
            const [dep_pass, dep_fail] = depositSnap.docs.map(snap => snap.data()).partition(x => x.type === type);
            data.deposits = dep_pass.map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);
            data.transfer_deposits = dep_pass.filter(doc => doc.memo.includes("TFD")).map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);
  
            //Expense data
            const expenseSnap = await db.collection('purchases').where('stock', '==', doc.id).get(); //.orderBy("date", 'desc')
            const [pass, fail] = expenseSnap.docs.map(snap => snap.data()).partition(x => x.type === type);
            data.expenses = pass;
            data.cogs = data.expenses.map(expense => expense.amount).reduce((a,c) => a + c, 0);
            data.unpaid = data.expenses.filter(x => x.isPayable).reduce((a,c) => a + c.amount, 0);
  
            //Payables data
            data.payables = data.expenses.filter(x => moment(x.paidDate).isAfter(monthEnd, 'month') || x.isPayable)
                                    .filter(x => (x.memo || "").includes("NTO"))
                                    .reduce((a,c) => a + c.amount, 0);
  
            //Misc data
            data.profit = data.revenue - data.cogs;
            data.rowLink = `../car/${data.stock}`;
  
            return data;
          }
        );
        let rows = await Promise.all(promises);
        return rows;
      }
      
      async function getTransactionData() {
        const trasnactionSnap = await db.collection('purchases')
          .where('paidDate', '>=', monthStart.format("YYYY/MM/DD"))
          .where('paidDate', '<=', monthEnd.format("YYYY/MM/DD"))
          .get();
        
        const currentDeals = snaps["deals"].docs.map(x => x.id);
        const transactions = trasnactionSnap.docs.map((doc, i) => doc.data());
        let paidCars = transactions.filter(x => (x.memo || "").includes("NTO"))
                    .filter(x => !x.isPayable)
                    .filter(x => !currentDeals.includes(x.stock))
                    .map(x => x.stock);
                    
        paidCars = new Set(paidCars);
        const paidCarAmounts = [...paidCars].map( (stock, i) => {
          const relevantTransactions = transactions.filter(x => x.stock === stock);
          const paid = relevantTransactions.filter(x => (x.memo || "").includes("NTO")).reduce((a,c) => a + c.amount, 0);
          const dates = relevantTransactions.map(x => moment(x.date));
          const date = moment.max(dates).format("MM-DD-YYYY");
          
          return {
            stock,
            paid,
            date,
            type: "paid"
          }
        });

        return paidCarAmounts;
      }

      async function getServiceData(params) {
        let promises = snaps.service.docs.map(async (doc, i) => {
          const order = {...doc.data(), id: doc.id};
          const {revenue = 0} = order;

          let car = "";
          if(order.car){
            console.log(order.id, order.car)
            let carDoc = await db.doc(`cars/${order.car}`).get();
            carDoc = carDoc.data() || {};
            car = `${carDoc.year || ''} ${carDoc.make || ''} ${carDoc.model || ''}`;
          }else {
            car = "No car"
          }


          let customer = await db.doc(`customers/${order.customer}`).get();
          customer = customer.data();
          customer = `${customer.first_name || ''} ${customer.last_name || ''}`;

          let deposits = await db.collection(`deposits`).where("stock", "==", order.id).get();
          deposits = deposits.docs.map(doc => ({...doc.data(), id: doc.id}));
          deposits = deposits.reduce((a,c) => a + (c.amount || 0), 0);
          const receivable = revenue - deposits;

          let services = await db.collection("services").where("order", "==", order.id).get();
          services = services.docs.map(doc => ({...doc.data(), id: doc.id}));

          let expenses = await db.collection("purchases").where("stock", "==", order.id).get();
          expenses = expenses.docs.map(doc => ({...doc.data(), id: doc.id}));

          const labor_value = services.reduce((a,c) => a + (c.cost || 0), 0);
          const purchase_value = expenses.reduce((a,c) => a + (c.amount || 0), 0);
          const cost = labor_value + purchase_value;
          const profit = revenue - cost;
        
          return {
            ...order,
            revenue,
            receivable,
            profit,
            cost,
            car,
            customer,
            deposits,
            rowLink: `/service-order/${order.id}`,
            type: "service",
          };
        });
        promises = await Promise.all(promises);
        return promises.flat();
      }

      const tableData = await Promise.all([
        getDealData(), 
        getData({type: "shipping"}), 
        getData({type: "shipping_in"}), 
        getData({type: "finance"}), 
        getTransactionData(),
        getServiceData()
      ]);
      console.log(tableData);

      setPayload(tableData.flat());

      StateManager.setLoading(false);
    }
    fetchData();
  }, [month]);

  const keysToRemove = StateManager.isBackoffice() ? [] : [
    "finance",
    "shipping",
    "service",
    "trades",
    "payables",
    "taxes",
    "ntos"
  ];

  const shippingRows = (i) => [
    i.filter(x => x.type === "shipping_in").filter(x => defaultFilter(x, term)),
    i.filter(x => x.type === "shipping").filter(x => defaultFilter(x, term))
  ].flat();

  const sections = {
    'cars-sold': (i) => <SoldCars rows={i.filter(x => x.type === "deal")} />,
    'verified-deals': (i) => <Deals rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} filter={x => x.deposits >= 1000} />,
    'working': (i) => <Deals rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} filter={x => x.deposits < 1000} />,
    'ntos': (i) => <NTOs rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} filter={x => x.updated_nto && x.updated_nto > 0} />,
    'funding': (i) => <Funding rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} />,
    'finance': (i) => <Finance rows={i.filter(x => x.type === "finance").filter(x => defaultFilter(x, term))} />,
    'shipping': (i) => <Shipping rows={shippingRows(i)}  />,
    'service': (i) => <Service orders={i.filter(x => x.type === "service").filter(x => defaultFilter(x, term))}  />,
    'trades': (i) => <Trades rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} />,
    'payables': (i) => <Payables rows={i.filter(x => defaultFilter(x, term))} />,
    'commissions': (i) => <Commissions rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} />,
    'consignments': (i) => <Consignments rows={i.filter(x => x.type === "deal").filter(x => consignmentFilter(x, term))} />,
    'taxes': (i) => <Taxes rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} />,
    'DMV': (i) => <DMV rows={i.filter(x => x.type === "deal").filter(x => defaultFilter(x, term))} />,
  }.filterKeys(keysToRemove);

  const changeMonth = (date) => {
    StateManager.setLoading(true);
    const new_date = moment(date).format("YYYY-MM")
    const url = new URL(window.location.href);
    history.push("/deal-dashboard/"+new_date+url.search);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <DateLine 
          label="Month" 
          startDate={moment(month).format("MM/DD/YYYY")}
          callback={changeMonth}
          dateFormat="MM/yyyy"
          showMonthYearPicker
        />
        {
          StateManager.isAdmin() && (
            <Grid style={{padding: 20}}>
              <TextLine
                id="filter"
                label={<b style={{paddingLeft: 7}}>Search Deals</b>}
                removeBox
                placeholder="Enter search term"
                value={term}
                onChange={updateTerm}
              />
            </Grid>
          )
        }
      </Grid>
      <TabContainer payload={payload} sections={sections}/>
    </>
  );
}


const defaultFilter = (item = {}, term) => Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)

const consignmentFilter = (item = {}, term) => (item.car.consign_rep || "").toLowerCase().includes(term.toLowerCase());