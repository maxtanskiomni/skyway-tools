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
import Trades from './Trades';
import Invoices from './Invoices.js';
import ExpensesSummary from './ExpensesSummary.js';
import ProfitSummary from './ProfitSummary.js';
import DMVSummary from './DMVSummary.js';
import FileBank from './FileBank.js';
import Paperwork from './Paperwork.js';
import SimpleTable from '../../components/SimpleTable';
import Header from '../../components/Header';
import firebase from '../../utilities/firebase';
import { getFunctions, httpsCallable } from "firebase/functions";
import history from '../../utilities/history';
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
import StatusLine from '../../components/StatusLine';
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
      // "engine-type",
      // "interior-color",
      // "interior-material",
      // "has-power-brakes",
      // "has-power-steering",
      // "has-air-conditioning",
      // "inspection-date",
    ]

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
          {/* <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={makeOrder}>
                Send to Service Dept
            </Button>
          </div> */}
        </>
    );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}



const sections = [
    {
      "title": "Electrical and underhood",
      "points": [
        "Engine Starts Properly",
        "Engine Idles Properly",
        "Starter Operation",
        "Ignition System",
        "Battery Output",
        "Battery Draw Test",
        "Alternator Output",
        "Visual inspection for leaks (carburetor, manifold)"
      ]
    },
    {
      "title": "Fliuds and engine bay",
      "points": [
        "Engine Oil/Filter Change",
        "Coolant",
        "Brake Fluid",
        "Automatic Transaxle/Transmission Fluid",
        "Transfer Case Fluid",
        "Power Steering Fluid",
        "Fluid Leaks Hoses, Lines and Fittings",
        "Belts",
        "Wiring",
        "Oil in Air Cleaner Housing",
        "Water, Sludge or Engine Coolant in Oil",
        "Timing Belt",
        "Engine Mounts",
        "Radiator",
        "Cooling Fans, Clutches and Motors",
        "Water Pump",
        "Fuel Pump Noise Normal",
        "Fuel Filter"
      ]
    },
    {
      "title": "Road test",
      "points": [
        "Engine Accelerates and Cruises Properly/Smoothly",
        "Engine Noise Normal (Cold/Hot & High/Low Speeds)",
        "Auto/Manual Transmission/Transaxle Operation Shift Quality",
        "Auto/Manual Transmission/Transaxle Noise Normal",
        "Shift Interlock Operates",
        "Properly Drive Axle/Transfer Case Operation Noise Normal",
        "Clutch Operates Properly",
        "Steers Normally (Response, Centering, Free Play)",
        "Body and Suspension Squeaks and Rattles",
        "Struts/Shocks Operate Properly",
        "Brakes Operate Properly",
        "Gauges Operate Properly"
      ]
    },
    {
      "title": "Exterior",
      "points": [
        "Doors Inspection/Alignment",
        "Hood Inspection/Alignment",
        "Decklid Inspection/Alignment",
        "Hood Release Mechanisms Operate Properly",
        "Hood Hinges Operate Properly",
        "Door Hinges Operate Properly",
        "Front-End Exterior Lights",
        "Back-End Exterior Lights",
        "Side Exterior Lights",
        "Hazard Lights"
      ]
    },
    {
      "title": "Interior",
      "points": [
        "Radio, Cassette, CD and Speakers",
        "Air Conditioning System -> vacuum, check compressor spinning, switches",
        "Heating System Defog/Defrost",
        "Horn",
        "Instrument Panel",
        "Windshield Wipers",
        "Convertible Top",
        "Door Handles and Release Mechanisms",
        "Door Locks",
        "Window Controls"
      ]
    },
    {
      "title": "Underbody",
      "points": [
        "Frame Damage",
        "Fuel Supply System",
        "Exhaust System Condition",
        "Tires Match and Are Correct Size",
        "Wheels Match and Are Correct Size",
        "Tire Tread Depth",
        "Tire Pressure",
        "Wheel Covers and Center Caps",
        "Rack-and-Pinion",
        "Linkage and Boots",
        "Control Arms",
        "Bushings and Ball Joints",
        "Tie Rods and Idler Arm",
        "Sway Bars",
        "Links and Bushings",
        "Springs Struts and Shocks",
        "Power Steering Pump",
        "Calipers and Wheel Cylinders",
        "Brake Pads and Shoes",
        "Rotors and Drums",
        "Brake Lines",
        "Hoses and Fittings",
        "Parking Brake",
        "Master Cylinder and Booster"
      ]
    }
  ];