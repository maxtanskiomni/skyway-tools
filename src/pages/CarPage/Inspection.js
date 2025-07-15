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
      
      // if(id.endsWith('-notes')) StateManager.updateCar(car.inspection = {...car.inspection, [id]: value});
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
    ];


    const makeNewOrder = async () => {
      // const counters = await firebase.firestore().doc('admin/counters').get();
      // const new_stock = counters.data().lastOrder + 1;
  
      // const customer = car?.consignor?.id === "4ed13115-1900-41d2-a14d-13f1242dd48a" ? "9c0d88f5-84f9-454d-833d-a8ced9adad49" : car?.consignor?.id || "9c0d88f5-84f9-454d-833d-a8ced9adad49";
      
      // await firebase.firestore().doc('orders/'+`SO${new_stock}`).set({
      //   status: "estimate", //constants.service_statuses[0],
      //   customer,
      //   date: moment().format('YYYY/MM/DD'),
      //   status_time: moment().format('YYYY/MM/DD'),
      //   stock: `SO${new_stock}`,
      //   car: stockNumber,
      //   thumbnail: thumbnail,
      // });
  
      // history.push(`/service-order/SO${new_stock}`);
  
      // await firebase.firestore().doc('admin/counters').update({lastOrder: new_stock});
      
    }

    const addToServiceOrder = async () => {
      //Get updated inspection
      let updated_inspection = await firebase.firestore().doc('inspections/'+stock).get();
      updated_inspection = updated_inspection.data();

      const issues = Object.keys(updated_inspection).filter((key) =>["red", "orange"].includes(updated_inspection[key]));
      console.log(issues);

      const services = issues.map(issue => {
        const service = {
          name: `${issue} - ${updated_inspection[`${issue}-description`] || ""}`,
          isComplete: false,
          isApproved: false, 
          status: "pending",
          mechanicName: "",
          assignDate: moment().format('YYYY/MM/DD'),
          time: 0, 
          cost: 0,
        }
        return service;
      })

      console.log(services);

      // let order = {name: `${stock} Inspection`, notes: "Inspection generated order", stock};
      // order.services = Object.values(sections)
      //                   .map(section => section.order_points === "all" ? section.points : section.order_points)
      //                   .flat()
      //                   .filter(point => !["green", "n/a", undefined, false].includes(updated_inspection[point]))
      //                   .map((point, i) => ({name: formatTitle(point)}) );
      // if(order.services.length < 1) return StateManager.setAlertAndOpen("Inspection must have atleast 1 yellow or red point to submit.", "error");

      // StateManager.setLoading(true);
      // const response = await RequestManager.post({function: "makeOrderWithServices", variables: {stock, order}});
      // order.shopmonkeyId = response.data.shopmonkeyId;
      // order.isSaved = true;

      // await firebase.firestore().collection("service_orders").doc().set(order, {merge: true});
      // // await firebase.firestore().doc('inspections/'+stock).update({complete: true});
      // StateManager.setLoading(false);
      // StateManager.setAlertAndOpen("Sync successful!", "success");
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
          <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={addToServiceOrder}>
                Add Issues to Service Order
            </Button>
          </div>
          {
            Object.values(sections).map((section, i) => {
              const {title, points} = section;
              const components = points.map((point, i) => 
                <div style={{marginBottom: '3px'}}>
                    <StatusLine id={point} data={inspection} label={StateManager.formatTitle(point)} updater={updater} />
                </div>
              )

              const notesId = `${title.toLowerCase().replace(/ /g, '-')}-notes`;

              return (
                <div style={{paddingTop: 10}}>
                  <Typography variant={"h5"} align="left" style={{padding: 7}}>
                    {formatTitle(title)}
                  </Typography>
                  {components}
                  <div style={{marginTop: 10, marginBottom: 20}}>
                    <TextLine 
                      id={notesId}
                      data={inspection}
                      onChange={(id, value) => updater('inspections', {[id]: value})}
                      label={`${formatTitle(title)} Notes`}
                      multiline={true}
                      rows={3}
                    />
                  </div>
                </div>
              )
            })
          }
          <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={addToServiceOrder}>
              Add Issues to Service Order
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
        "Oil Pan Leak",
        "Trans leak",
        "Differential leak",
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
        "Fuel Gauge Operates Properly",
        "Speedometer Operates Properly",
        "Temperature Gauge Operates Properly",
        "Tachometer Operates Properly",
        "Oil Gauge Operates Properly",
        "Oil Temperature Gauge Operates Properly",
        "Oil Pressure Gauge Operates Properly",
        "Water Gauge Operates Properly",
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