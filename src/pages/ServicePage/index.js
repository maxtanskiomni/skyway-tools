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
import Files from './Files.js';
import Parts from './Items.js';
import Summary from './Summary.js';
import Notes from './Notes.js';
import Times from './Times.js';
import Service from './Service.js';
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
import { StateManager } from '../../utilities/stateManager.js';

import algolia from '../../utilities/algolia';
import Items from './Items.js';

const tab = new URL(window.location.href).searchParams.get("tab");

export default function ServicePage(props) {
  const { stockNumber } = props.match.params;
  const [service, setService] = React.useState({});
  StateManager.setService = setService;
  StateManager.updateCar = data => setService({...service, ...data});

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const db = firebase.firestore();
      const serviceDoc = await db.doc('services/'+stockNumber).get();
      let service = serviceDoc.exists ? {...serviceDoc.data(), id: stockNumber} : {id: stockNumber};
      const orderDoc = await db.doc('orders/'+service.order).get();
      service.order = orderDoc.exists ? {...orderDoc.data(), id: service.order} : {};
      service.loaded = true;

      StateManager.setTitle(`${service.order.stock} - ${service.name || ""}`);

      setService(service);

      //Need to load car
      
      db.doc('cars/'+(service.order.car || null)).get()
        .then((carDoc) => {
          if(carDoc.exists) {
            const car = {...carDoc.data(), id: service.order.car};
            service.car = car;
            service.carTitle = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
            service.thumbnail = car.thumbnail;
          }
          service.car_loaded = true;
          setService({...service});
        });


      db.collection('parts').where('service', '==', stockNumber).get()
        .then((partsSnap) => {
          service.parts = partsSnap.docs.map(getDocData);
          service.parts_loaded = true;
          setService({...service});
        });

      db.collection('files').where('stock', '==', stockNumber).get()
        .then((fileSnap) => {
          service.files = fileSnap.docs.map(getDocData);
          service.files_loaded = true;
          setService({...service});
        });
      
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [stockNumber]);
  

  const tabs = {
    'summary':  {component: <Summary data={service} updater={setService}/>, condition: service.loaded && service.car_loaded },
    'parts':  {component: <Items {...service} items={service.parts} stockNumber={stockNumber} type="parts" showSummary/>, condition: service.parts_loaded},
    'time':   {component: <Times data={service}/>, condition: service.loaded},
    'files':   {component: <Files data={service}/>, condition: service.files_loaded},
    'notes':  {component: <Notes data={service}/>, condition: service.loaded},
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