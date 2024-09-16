import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import Shipping from './Shipping.js';
import Titles from './Titles.js';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';

import firebase from '../../utilities/firebase.js';
import history from '../../utilities/history.js';
import moment from 'moment';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js';


export default function BackOfficePage(props) {
  const [data, setData] = React.useState({});
  const [reload, setReload] = React.useState(true);
  StateManager.reload = () => setReload(!reload);

  React.useEffect(() => {
    async function fetchData(input = {}) {

      let new_data = {};
      const db = firebase.firestore();

      //Titles -> car.  Once a car is fully funded, the title tracker should start tracking its status
      // Every car that has a working deal
      // Add flag on date being entered.  title_status, shipping_status

      //Finance App -> credit-apps
      // where complete = false

      //Shipping -> Add_needs shipping flag to invoice once:
      // Every car that has a working deal (has a sale date and a customer)
      // Consider making a consolidated invoice for shipping, finance, and sale

      //Title data
      db.collection('deals').where('title_status', '!=', "complete").get()
      .then(snapshot => {
        new_data.outstanding_titles = snapshot.docs.map(getDocData);
        new_data.titles_loaded = true;
        setData({...new_data});
      })

      //Shipping data
      db.collection('deals').where('shipping_status', '!=', "complete").get()
        .then(snapshot => {
          new_data.outstanding_shippings = snapshot.docs.map(getDocData);
          new_data.shippings_loaded = true;
          setData({...new_data});
        })

      //Credit apps data
      db.collection('credit-apps').where('status', '!=', "complete").get()
      .then(snapshot => {
        new_data.outstanding_apps = snapshot.docs.map(getDocData);
        new_data.apps_loaded = true;
        setData({...new_data});
      })

    }
    fetchData();
    StateManager.updateData = fetchData;
  }, [reload]);

  let sections = {
    // 'finance': {component: <Titles data={data} />, condition: data.payables_loaded},
    'titles': {component: <Titles data={data} />, condition: data.deposits_loaded},
    'shipping': {component: <Shipping data={data} />, condition: data.payables_loaded},
  };

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