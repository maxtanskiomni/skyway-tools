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
  const [part, setService] = React.useState({});
  StateManager.setService = setService;
  StateManager.updateCar = data => setService({...part, ...data});

  React.useEffect(() => {
    async function fetchData(input = {}) {
      const db = firebase.firestore();
      const serviceDoc = await db.doc('parts/'+stockNumber).get();
      let part = serviceDoc.exists ? {...serviceDoc.data(), id: stockNumber} : {id: stockNumber};
      const orderDoc = await db.doc('orders/'+part.order).get();
      part.order = orderDoc.exists ? {...orderDoc.data(), id: part.order} : {};
      part.loaded = true;

      StateManager.setTitle(`${part.order.stock} - ${part.name || ""}`);

      setService(part);

      //Need to load car
      db.doc('cars/'+part.order.car).get()
        .then((carDoc) => {
          const car = {...carDoc.data(), id: part.order.car};
          if(carDoc.exists) {
            part.car = car;
            part.carTitle = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
            part.thumbnail = car.thumbnail;
          }
          part.car_loaded = true;
          setService({...part});
        });


      db.collection('files').where('stock', '==', stockNumber).get()
        .then((fileSnap) => {
          part.files = fileSnap.docs.map(getDocData);
          part.files_loaded = true;
          setService({...part});
        });
      
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [stockNumber]);
  

  const tabs = {
    'summary':  {component: <Summary data={part} updater={setService}/>, condition: part.loaded && part.car_loaded },
    // 'parts':  {component: <Items {...part} items={part.parts} stockNumber={stockNumber} type="parts" showSummary/>, condition: part.parts_loaded},
    'time':   {component: <Times data={part}/>, condition: part.loaded},
    'files':   {component: <Files data={part}/>, condition: part.files_loaded},
    'notes':  {component: <Notes data={part}/>, condition: part.loaded},
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