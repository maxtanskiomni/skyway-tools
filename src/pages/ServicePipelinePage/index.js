import React from 'react';
import Grid from '@mui/material/Grid';
import Items from './Items.js';
import DateLine from '../../components/DateLine.js';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history.js';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import { StateManager } from "../../utilities/stateManager.js";
import constants from '../../utilities/constants.js';
import TextLine from '../../components/TextLine.js';
import { CircularProgress } from '@mui/material';


let timeout = () => null
export default function ServicePipeline(props) {
  const { date = moment().format("YYYY-MM-DD") } = props.match.params;

  let params = getParams();
  const initTerm = params.q || "";

  const period =  moment(date).date() <= 15 ? 1 : 2;
  const timePeriod = moment(date).format(`YYYY-MM-${period}`)
  
  const [term, setTerm] = React.useState(initTerm);
  const [loading, setLoading] = React.useState(false);
  const [orders, setOrders] = React.useState([]);
  StateManager.setTitle("Service Pipeline");

  React.useEffect(() => {
    async function fetchData(input = {}) {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      // let tasks = [], data = {};

      //Get all orders
      const snap = await db.collection('orders').where("status", '!=', "completed").get();
      const orderList = snap.docs.map(getDocData).map(order => {
        order.total_time = moment().diff(order["status_time"], 'days');
        order.order_time = moment().diff(order["date"], 'days');
        return order
      });

      //Get car and customer data
      const customerPromises = orderList.map(async x => {
        if(x.customer){
          let cust = await db.doc('customers/'+x.customer).get();
          cust = cust.data() || {};
          x.customer =`${cust.first_name} ${cust.last_name}`;
        }
      });

      const carPromises = orderList.map(async x => {
        if(x.car){
          let car = await db.doc('cars/'+x.car).get();
          x.carTitle = car.exists ? `${car.data().stock} ${car.data().year} ${car.data().make} ${car.data().model}` : "";
          x.score = Math.round(car.data().score || 0);
          x.thumbnail = car.data().thumbnail || "";
        }
      });

      await Promise.all([...customerPromises, ...carPromises]);

      setOrders(orderList);

      StateManager.setLoading(false);
    }
    fetchData();
    StateManager.updatePipeline = fetchData;
  }, [date]);

  const updateTerm = (id, value) => {
    if(value === null) value = ""
    setLoading(true);
    setTerm(value);
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      const url = new URL(window.location.href);
      let newUrl = `${url.pathname}`;
      if(!url.search) newUrl += `?q=${value}`;
      else {
        newUrl = `${newUrl}${url.search}`;
        //Place or replace the term variable
        if(newUrl.includes("?q=")) newUrl = newUrl.replace(/[?&]q=\w*/g,  `?q=${value}`);
        else if(newUrl.includes("&q=")) newUrl = newUrl.replace(/[?&]q=\w*/g,  `&q=${value}`);
        else newUrl += `&q=${value}`
        console.log("2 ", newUrl)
      }
      history.replace(newUrl);
      setLoading(false);
    }, 1000);
    // setTerm(value);
  }

  let sections = {};
  for(const status of constants.order_statuses.slice(0, -1)){
    const items = orders.filter(x => x.status === status).filter(x => defaultFilter(x, term))
    sections[status] = (i) => loading ? <CircularProgress /> : <Items items={items} showSummary/>
  }
  const unassignedItems = orders.filter(x => !constants.order_statuses.includes(x.status)).filter(x => defaultFilter(x, term));
  sections["unassigned"] = (i) => loading ? <CircularProgress /> : <Items items={unassignedItems} showSummary/>

  const updateSelectedSOs = () => {
    StateManager.selectedSOs = [];
    StateManager.openSOSelect && StateManager.openSOSelect();
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <Grid style={{padding: 20}}>
          <TextLine
            id="filter"
            label={<b style={{paddingLeft: 7}}>Search Services</b>}
            removeBox
            placeholder="Enter search term"
            value={term}
            onChange={updateTerm}
          />
        </Grid>
      </Grid>
      <TabContainer payload={orders} sections={sections} selectCallback={updateSelectedSOs}/>
    </>
  );
}


const getDocData = doc => {
  return {id: doc.id, ...doc.data()}
}

const defaultFilter = (item = {}, term) => Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)

const getCarTitle = car => {
  return `${car.id} ${car.year} ${car.model}`;
}


const getParams = () => {
  let p = new URL(window.location.href).search
                                      .replace("?","")
                                      .split("&")
                                      .map(x => x.split("="))
                                      .reduce((a,c) => Object.assign(a, {[c[0]]: c[1]}),{});

  if(p.i === "e") p.i = "==";
  else if(p.i === "ne") p.i = "!=";
  else if(p.i === "g") p.i = ">";
  else if(p.i === "ge") p.i = ">=";
  else if(p.i === "l") p.i = "<";
  else if(p.i === "le") p.i = "<=";

  if((p.v || "").includes("%20")) p.v = p.v.replace(/%20/g, " ");
  if((p.q || "").includes("%20")) p.q = p.q.replace(/%20/g, " ");

  return p;
}