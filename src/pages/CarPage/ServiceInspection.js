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
import Customers from './Customers.js';
import DateSelector from './DateSelector.js';
import Trades from './Trades.js';
import Invoices from './Invoices.js';
import ExpensesSummary from './ExpensesSummary.js';
import ProfitSummary from './ProfitSummary.js';
import DMVSummary from './DMVSummary.js';
import FileBank from './FileBank.js';
import Paperwork from './Paperwork.js';
import SimpleTable from '../../components/SimpleTable.js';
import Header from '../../components/Header.js';
import firebase from '../../utilities/firebase.js';
import { getFunctions, httpsCallable } from "firebase/functions";
import history from '../../utilities/history.js';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js'

import Preview from '../../components/Preview.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import StatusLine from '../../components/StatusLine.js';
import Dropdown from '../../components/Dropdown.js';
import RequestManager from '../../utilities/requestManager.js';

export default function Inspection(props) {
    const { car = {} } = props;
    const { stock } = car;
    let inspection = {...car.inspection, ...car} || {};

    const updater = (table, data) => firebase.firestore().doc(`${table}/${stock}`).set(data, {merge: true});

    const updateText = (id, value) => {
      let table = "inspections"
      if(id == "miles") table="cars";
      if(id == "color") table="cars";
      if(id == "vin") table="cars";
      if(id == "engine-type") table="cars";
      if(id == "interior-color") table="cars";
      if(id == "interior-material") table="cars";
      // return console.log(table, {[id]: value});
      updater(table, {[id]: value, needsDAUpdate: true});
    }

    const fields = [
      "inspector", 
      "color",
      "miles",
      "vin",
      "engine-type",
      "interior-color",
      "interior-material",
      "inspection-date",
    ]

    const sections = [
      {title: "pre-tasks", points: ["make-keytag", "confirm-vin", "confirm-miles"]},
      {title: "exterior", order_points: ["side-mirrors", "windshield", "wipers-condition"], points: ["paint-quality", "body-chips", "body-scratches", "body-dents", "body-bubbles", "convertible-top-condition", "side-mirrors", "tires", "headlights-condition", "windshield", "wipers-condition", "door-windows", "rear-window", "taillights-condition", "exterior-miscellaneous"]},
      {title: "trunk", order_points: [], points: ["trunk-door", "jambs", "wires", "inside-paint", "mat", "spare-tire", "jack", "trunk-miscellaneous"]},
      {title: "function", order_points: "all", points: ["headlights", "running-lights", "brake-lights", "front-blinkers", "rear-blinkers", "reverse-lights", "dome-lights", "horn", "wipers", "radio", "air-conditioning", "heat", "driver-seat-adjusting", "passenger-seat-adjusting", "window-rolling", "convertible-top", "functional-miscellaneous"]},
      {title: "interior", order_points: [], points: ["front-seats", "rear-seats", "center-console", "dashboard", "glove-box", "guages-condition", "steering-wheel", "carpet", "headliner", "rearview-mirror", "sun-visor", "door-panels", "arm-rests", "window-cranks", "door-sills", "door-jambs", "kick-panels", "interior-miscellaneous"]},
      {title: "engine-bay", order_points: ["belts", "oil", "coolant", "leaks", "battery-buddy", "battery-condition", "alternator", "engine-bay-miscellaneous"], points: ["bay-cleanliness", "hood-cleanliness", "engine-cleanliness", "mechanical-cleanliness", "belts", "oil", "washer-fluid", "coolant", "leaks", "battery-buddy", "battery-condition", "alternator", "engine-bay-miscellaneous"]},
      {title: "test-drive", order_points: "all", points: ["starter", "speedometer", "tachometer", "tempurature", "gas-gauge", "oil-gauge", "shift-indicator", "steering", "brakes", "shifting", "overall-ride", "drive-miscellaneous"]},
      {title: "undercarriage", order_points: "all", points: ["undercoating", "full-leaks", "body-rails", "floorboards", "suspension", "exhaust-system", "muffler", "undercarraige-miscellaneous"]},
      {title: "tasks", order_points: [], points: ["wash-exterior", "complete-undercoating", "undercarriage-pictures", "undercarriage-video", "secure-ziptie", "move-to-detail-queue", "send-to-service-dept"]},
    ];

    const makeOrder = async () => {
      //Get updated inspection
      let updated_inspection = await firebase.firestore().doc('inspections/'+stock).get();
      updated_inspection = updated_inspection.data();
      console.log(updated_inspection);

      let order = {name: `${stock} Inspection`, notes: "Inspection generated order", stock};
      order.services = Object.values(sections)
                        .map(section => section.order_points === "all" ? section.points : section.order_points)
                        .flat()
                        .filter(point => !["green", "n/a", undefined, false].includes(updated_inspection[point]))
                        .map((point, i) => ({name: formatTitle(point)}) );
      if(order.services.length < 1) return StateManager.setAlertAndOpen("Inspection must have atleast 1 yellow or red point to submit.", "error");

      StateManager.setLoading(true);
      const response = await RequestManager.post({function: "makeOrderWithServices", variables: {stock, order}});
      order.shopmonkeyId = response.data.shopmonkeyId;
      order.isSaved = true;

      await firebase.firestore().collection("service_orders").doc().set(order, {merge: true});
      // await firebase.firestore().doc('inspections/'+stock).update({complete: true});
      StateManager.setLoading(false);
      StateManager.setAlertAndOpen("Sync successful!", "success");
    }

    return (
        <>
          <Typography variant={"h5"} align="left" style={{padding: 7}}>
            {formatTitle("inspection-data")}
          </Typography>
          {
            fields.map((field, i) => 
                <div style={{marginBottom: '3px'}}>
                    <TextLine id={field} data={inspection} onChange={updateText} label={StateManager.formatTitle(field)} />
                </div>
            )
          }
          {
            Object.values(sections).map((section, i) => {
              const {title, points} = section;
              const components = points.map((point, i) => 
                <div style={{marginBottom: '3px'}}>
                    <StatusLine id={point} data={inspection} label={StateManager.formatTitle(point)} updater={updater} />
                </div>
              )

              return (
                <div style={{paddingTop: 10}}>
                  <Typography variant={"h5"} align="left" style={{padding: 7}}>
                    {formatTitle(title)}
                  </Typography>
                  {components}
                </div>
              )

            })
          }
          <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={makeOrder}>
                Send to Service Dept
            </Button>
          </div>
        </>
    );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}