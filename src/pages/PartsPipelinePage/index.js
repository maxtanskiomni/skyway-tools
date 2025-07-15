import React from 'react';
import Grid from '@mui/material/Grid';
import Items from './Items.js';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history.js';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import { StateManager } from "../../utilities/stateManager.js";
import constants from '../../utilities/constants.js';
import TextLine from '../../components/TextLine.js';
import Blade from '../../components/Blade.js';
import { CircularProgress } from '@mui/material';
import PartForm from '../../components/forms/PartForm.js';


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
  StateManager.setTitle("Parts Pipeline");

  const [open, setOpen] = React.useState(false);
  const [selectedPart, setSelected] = React.useState(false);
  StateManager.showPart = (part) => {
    console.log(part)
    setOpen(!open);
    setSelected(part);
  }

  React.useEffect(() => {
    async function fetchData(input = {}) {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      // let tasks = [], data = {};

      //Get all orders
      const snap = await db.collection('parts').where("status", '!=', "complete").get();
      let partList = snap.docs.map(getDocData).filter(x => !x.shopmonkeyId);

      // Get order data
      const orderPromises = partList.map(async x => {
        if(x.order){
          let order = await db.doc('orders/'+x.order).get();
          order = order.data() || {};
          let service = await db.doc('services/'+x.service).get();
          service = service.data() || {};

          return {...x, orderID: x.order, order, writer: order.writer, serviceID: x.service, service: service.name || ""};
        }
      });
      partList = await Promise.all(orderPromises);
      partList = partList.filter(item => {
        const {order = {}} = item;
        return ["parts", "ready", "working", "payment", "complete"].includes(order.status) && !item.returnComplete;
      })


      // Get car and customer data
      const customerPromises = partList.map(async x => {
        const {order = {}} = x;
        if(order.customer){
          let cust = await db.doc('customers/'+order.customer).get();
          cust = cust.data() || {};
          x.customer =`${cust.first_name} ${cust.last_name}`;
        }
      });

      const carPromises = partList.map(async x => {
        const {order = {}} = x;
        if(order.car){
          let car = await db.doc('cars/'+order.car).get();
          car = car.data() || {};
          x.car = order.car;
          x.carTitle =`${car.stock} ${car.year} ${car.model}`;
        }
      });

      await Promise.all([...customerPromises, ...carPromises]);

      setOrders(partList);

      StateManager.setLoading(false);
    }
    fetchData();
    StateManager.updateCar = fetchData;
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
      }
      history.replace(newUrl);
      setLoading(false);
    }, 1000);
    // setTerm(value);
  }

  let sections = {};
  for(const status of constants.part_statuses.slice(0, -1)){
    const items = orders.filter(x => x.status === status).filter(x => defaultFilter(x, term))
    sections[status] = (i) => loading ? <CircularProgress /> : <Items items={items} type={status} showSummary/>
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <Grid style={{padding: 20}}>
          <TextLine
            id="filter"
            label={<b style={{paddingLeft: 7}}>Search Parts</b>}
            removeBox
            placeholder="Enter search term"
            value={term}
            onChange={updateTerm}
          />
        </Grid>
      </Grid>
      <TabContainer payload={orders} sections={sections}/>
      <Blade open={open} onClose={() => setOpen(false)} title={selectedPart.name} >
        <PartForm data={selectedPart} />
      </Blade>
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