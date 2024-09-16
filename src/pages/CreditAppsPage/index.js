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
export default function CreditAppsPage(props) {

  // Parse the search query parameters from the URL
  const url = new URL(window.location.href);
  const startDate = url.searchParams.get('startDate') || moment().subtract(7, "days").format('YYYY-MM-DD');
  const endDate = url.searchParams.get('endDate') || moment().format('YYYY-MM-DD');

  let params = getParams();
  const initTerm = params.q || "";
  
  const [term, setTerm] = React.useState(initTerm);
  const [loading, setLoading] = React.useState(false);
  const [payload, setPayload] = React.useState([]);
  StateManager.setTitle("Credit Applications");
  const tab = new URL(window.location.href).searchParams.get("tab");

  React.useEffect(() => {
    async function fetchData(input = {}) {
      setLoading(true);
      const db = firebase.firestore();

      //Get complete services by date
      console.log(startDate, endDate);
      let appsQuery = db.collection('credit-apps')
                            .where('time', '>=', startDate)
                            .where('time', '<=', endDate+"ZZZZZZZZZZZZ");
      
      let apps = await appsQuery.get();
      apps = apps.docs.map(getDocData);
      // .filter(app => {
      //   return StateManager.isBackoffice() || [StateManager.userID].includes(lead.sales_id)
      // })
      // .map(async lead => {
      //   if(lead.stock){
      //     let car = await db.doc(`cars/${lead.stock}`).get();
      //     lead.car = car.data();
      //   }
      //   return lead;
      // });

      apps = await Promise.all(apps);

      setPayload(apps)
      setLoading(false);
    }
    fetchData();
    StateManager.upadteLeads = fetchData;
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
    'credit-apps': (i) => loading ? <CircularProgress /> : <Items items={(payload || []).filter(x => defaultFilter(x, term))} showSummary/>,
  };

  const changeDate = (dates) => {
    const [startDate, endDate] = dates;
    if(!endDate) return
    StateManager.setLoading(true);

    const new_start_date = moment(startDate).format("YYYY-MM-DD");
    const new_end_date = moment(endDate).format("YYYY-MM-DD");
    const url = new URL(window.location.href);

    url.searchParams.set('startDate', new_start_date); // Replace or add startDate
    url.searchParams.set('endDate', new_end_date); // Replace or add endDate
  
    // Push the new URL to history
    history.push(url.pathname + url.search);
    StateManager.setLoading(false);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <DateLine 
          label="Period" 
          selectsRange
          startDate={moment(startDate).format("MM/DD/YYYY")}
          endDate={moment(endDate).format("MM/DD/YYYY")}
          callback={changeDate}
          dateFormat="MM/dd/yyyy"
        />
        <Grid style={{padding: 20}}>
          <TextLine
            id="filter"
            label={<b style={{paddingLeft: 7}}>Search Credit Apps</b>}
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