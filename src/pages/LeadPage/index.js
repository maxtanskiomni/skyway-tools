import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Files from './Files.js';
import Summary from './Summary.js';
import Notes from './Notes.js';
import Times from './Times.js';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import Preview from '../../components/Preview.js';
import { StateManager } from '../../utilities/stateManager.js';

import algolia from '../../utilities/algolia';
import Items from './Items.js';
import Contacts from './Contacts.js';

const tab = new URL(window.location.href).searchParams.get("tab");

export default function LeadPage(props) {
  const { lead_id } = props.match.params;
  const [lead, setLead] = React.useState({});
  StateManager.setLead = setLead;
  StateManager.updateCar = data => setLead({...lead, ...data});

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const db = firebase.firestore();
      const doc = await db.doc('leads/'+lead_id).get();
      let lead = doc.exists ? {...doc.data(), id: lead_id} : {id: lead_id};
      console.log(lead)
      lead.loaded = true;

      StateManager.setTitle(`Lead - ${lead.name || ""}`);

      setLead(lead);

      //Need to load car
      
      db.doc('cars/'+lead.stock).get()
        .then((carDoc) => {
          const car = {...carDoc.data(), id: lead.stock};
          if(carDoc.exists) {
            lead.car = car;
            lead.carTitle = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
            lead.thumbnail = car.thumbnail;
          }
          lead.car_loaded = true;
          setLead({...lead});
        });

      db.collection('files').where('stock', '==', lead_id).get()
        .then((fileSnap) => {
          lead.files = fileSnap.docs.map(getDocData);
          lead.files_loaded = true;
          setLead({...lead});
        });
      
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [lead_id]);
  

  const tabs = {
    'summary':  {component: <Summary data={lead} updater={setLead}/>, condition: lead.loaded && lead.car_loaded },
    'contacts':  {component: <Contacts {...lead}/>, condition: lead.car_loaded},
    'files':   {component: <Files data={lead}/>, condition: lead.files_loaded},
    'notes':  {component: <Notes data={lead}/>, condition: lead.loaded},
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
    StateManager.setTitle(`${StateManager.title.split(" - ").slice(0,2).join(" - ")} - ${index}`);
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