import React from 'react';
import Grid from '@mui/material/Grid';
import Items from './Items.js';
import DateLine from '../../components/DateLine';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import { StateManager } from "../../utilities/stateManager.js";
import constants from '../../utilities/constants.js';
import TextLine from '../../components/TextLine.js';
import { CircularProgress } from '@mui/material';


let timeout = () => null
export default function MechanicPage(props) {
  const { startDate = moment().format("YYYY-MM-DD"), endDate = moment().subtract(2, "weeks").format("YYYY-MM-DD") } = props.match.params;

  let params = getParams();
  const initTerm = params.q || "";

  // const period =  moment(date).date() <= 15 ? 1 : 2;
  // const timePeriod = moment(date).format(`YYYY-MM-${period}`)
  // const startDate = period === 1 ? moment(date).startOf("month").format(`YYYY/MM/DD`) : moment(date).format(`YYYY/MM/16`);
  // const endDate = period === 1 ? moment(date).format(`YYYY/MM/15`) : moment(date).endOf("month").format(`YYYY/MM/DD`);
  // console.log(date, startDate, endDate)
  
  const [term, setTerm] = React.useState(initTerm);
  const [loading, setLoading] = React.useState(false);
  const [payload, setPayload] = React.useState({});
  StateManager.setTitle("Mechanic Dashboard");
  const tab = new URL(window.location.href).searchParams.get("tab");

  React.useEffect(() => {
    async function fetchData(input = {}) {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      let tasks = [], data = {};

      //Get unfinished services
      let unfinishedQuery = db.collection('services').where('status', '!=', constants.service_statuses.at(-1));

      //get cars for the serivces
      const getCars = async (services) => {
        const orders = services.map(service => service.order);
        const carQueires = orders.map(async order => {
          const orderSnap = await db.doc(`orders/${order}`).get();
          const orderData = orderSnap.data() || {};
          const carSnap = await db.doc(`cars/${orderData.car || null}`).get();
          return carSnap.exists ? {...carSnap.data(), id: orderData.car, order, orderData} : {year: "", make: "", model: "", id: "N/A", order, orderData} 
        });
        const cars = await Promise.all(carQueires);

        services = services.map(service => {
          const car = cars.filter(x => x.order === service.order).at(0);
          return {...service, car: car.id, carTitle: getCarTitle(car), writer: car.orderData.writer};
        });

        return services;
      }

      //get cars for the serivces
      const getReadyOrders = async (services) => {
        const allOrders = services.map(service => service.order);
        const orderQueries = allOrders.map(async order => {
          const orderSnap = await db.doc(`orders/${order}`).get();
          return orderSnap.exists ? {...orderSnap.data(), id: order}  : {} 
        });
        const orders = await Promise.all(orderQueries);

        return orders.filter(order => constants.order_statuses.slice(1,-2).includes(order.status)).map(x => x.id);
      }

      tasks[0] = unfinishedQuery.get()
                    .then(async (snap) => {
                      console.log("unfinsihed going")
                      let services = snap.docs.map(getDocData);
                      if(!StateManager.isManager()) services = services.filter(x => x.mechanicID === StateManager.userID); //"FXbkDzwrCVeEda2g2bxPEJLfIFD2"
                      services = await getCars(services);
                      const orders = await getReadyOrders(services);
                      data.pending_services = services;
                      data.ready_services = services.filter(service => orders.includes(service.order));
                      setPayload({...data});
                    });

      //Get complete services by date
      let finishedQuery = db.collection('services')
                            .where('status', '==', constants.service_statuses.at(-1))
                            .where('status_time', '>=', startDate.replace(/-/g, "/"))
                            .where('status_time', '<=', endDate.replace(/-/g, "/"));

      tasks[1] = finishedQuery.get()
                    .then(async (snap) => {
                      console.log("finsihed going")
                      let services = snap.docs.map(getDocData);
                      services = await getCars(services);
                      if(!StateManager.isManager()) services = services.filter(x => x.mechanicID === StateManager.userID); //"FXbkDzwrCVeEda2g2bxPEJLfIFD2"
                      data.finished_services = services;
                      setPayload({...data});
                    });

      await Promise.all(tasks);

      StateManager.setLoading(false);
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [startDate, endDate]);

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

  const sections = {
    'pending': (i) => loading ? <CircularProgress /> : <Items items={(payload.pending_services || []).filter(x => defaultFilter(x, term))} type="pending" showSummary/>,
    // 'ready': (i) => loading ? <CircularProgress /> : <Items items={(payload.ready_services || []).filter(x => defaultFilter(x, term))} showSummary/>,
    'complete': (i) => loading ? <CircularProgress /> : <Items items={(payload.finished_services || []).filter(x => defaultFilter(x, term))} type="complete" showSummary/>
  };

  const changeDate = (date) => {
    const [start, end] = date
    if(!start || !end) return;
    // StateManager.setLoading(true);
    const start_string = moment(start).format("YYYY-MM-DD");
    const end_string = moment(end).format("YYYY-MM-DD");
    const url = new URL(window.location.href);
    history.push(`/mechanic-summary/${end_string}/${start_string}${url.search}`);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        {
          tab === "complete" ? 
            <DateLine 
              selectsRange
              label="Period" 
              startDate={startDate}
              endDate={endDate}
              callback={changeDate}
              dateFormat="MM/dd/yyyy"
              // showMonthYearPicker
            />
          : null
        }
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
      <TabContainer payload={payload} sections={sections}/>
    </>
  );
}


const getDocData = doc => {
  return {id: doc.id, ...doc.data()}
}

const defaultFilter = (item = {}, term) => Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)

const getCarTitle = car => {
  return `${car.id || ""} ${car.year || ""} ${car.model || ""}`;
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