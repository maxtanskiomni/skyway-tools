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
export default function LeadsPage(props) {

  // Parse the search query parameters from the URL
  const url = new URL(window.location.href);
  const startDate = url.searchParams.get('startDate') || moment().subtract(7, "days").format('YYYY-MM-DD');
  const endDate = url.searchParams.get('endDate') || moment().format('YYYY-MM-DD');

  let params = getParams();
  const initTerm = params.q || "";
  
  const [term, setTerm] = React.useState(initTerm);
  const [loading, setLoading] = React.useState(false);
  const [payload, setPayload] = React.useState({});
  StateManager.setTitle("Leads Dashboard");
  const tab = new URL(window.location.href).searchParams.get("tab");

  React.useEffect(() => {
    async function fetchData(input = {}) {
      setLoading(true);
      const db = firebase.firestore();
      let data = {};

      //Get complete services by date
      let leadsQuery = db.collection('leads')
                            .where('date', '>=', startDate)
                            .where('date', '<=', endDate);

      let tasks = [
        leadsQuery.get(),
        db.collection('leads').where("status", "==", constants.lead_statuses.at(0)).get(),
        db.collection('leads').where("status", "==", constants.lead_statuses.at(1)).get(),
        db.collection('leads').where("status", "==", constants.lead_statuses.at(2)).get(),
      ];

      const leadQueries = await Promise.all(tasks);

      let leads = leadQueries.map(snapshots => snapshots.docs).flat().map(getDocData)
        .map(async lead => {
          if(lead.stock && (/^\d+-[A-Z]{2,3}$/.test(lead.stock) || /^SN\d+$/.test(lead.stock) ) ){
            let car = await db.doc(`cars/${lead.stock}`).get();
            lead.car = car.data();
          }
          else{
            await db.doc(`leads/${lead.id}`).delete();
          }
          return lead;
        });     


      const isAuthed = (lead) => (StateManager.isBackoffice() || [StateManager.userID].includes(lead.sales_id));
      leads = (await Promise.all(leads))
        .removeDuplicates()
        .filter(isAuthed)
        .map(lead => {

          if(!!lead.phone) lead.new = ( !lead.contacts || lead.contacts.filter(c => ["phone", "text"].includes(c.type)).length < 1) && "isNew";
          else lead.new =  !lead.contacts || lead.contacts.length === 0;
          return lead;
        })
        .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || '')); // Sort by sortDate in descending order

      data.pending = leads.filter(lead => lead.status === constants.lead_statuses.at(0) || !lead.status);
      data.nonResponsive = leads.filter(lead => lead.status === constants.lead_statuses.at(1));
      data.current = leads.filter(lead => lead.status === constants.lead_statuses.at(2));
      data.complete = leads.filter(lead => constants.lead_statuses.slice(-4).includes(lead.status));

      setPayload(data)
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
    'pending': (i) => loading ? <CircularProgress /> : <Items items={(payload.pending || []).filter(x => defaultFilter(x, term))} type="indicator" showSummary/>,
    'unresponsive': (i) => loading ? <CircularProgress /> : <Items items={(payload.nonResponsive || []).filter(x => defaultFilter(x, term))} type="indicator" showSummary/>,
    'current': (i) => loading ? <CircularProgress /> : <Items items={(payload.current || []).filter(x => defaultFilter(x, term))} type="indicator" showSummary/>,
    'complete': (i) => loading ? <CircularProgress /> : <Items items={(payload.complete || []).filter(x => defaultFilter(x, term))} disableItems showSummary/>
  };

  const changeDate = (dates) => {
    const [startDate, endDate] = dates;
    if(!endDate) return;
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
        {
          tab === "complete" ? 
            <DateLine 
              label="Period" 
              selectsRange
              startDate={moment(startDate).format("MM/DD/YYYY")}
              endDate={moment(endDate).format("MM/DD/YYYY")}
              callback={changeDate}
              dateFormat="MM/dd/yyyy"
            />
            : null
        }
        <Grid style={{padding: 20}}>
          <TextLine
            id="filter"
            label={<b style={{paddingLeft: 7}}>Search Leads</b>}
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