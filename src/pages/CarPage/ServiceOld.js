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
import TextField from '@mui/material/TextField';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js';
import { useTheme } from '@mui/material/styles';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import StatusLine from '../../components/StatusLine.js';
import Dropdown from '../../components/Dropdown.js';
import PaperDiv from '../../components/PaperDiv.js';
import RequestManager from '../../utilities/requestManager.js';

export default function Service(props) {
    const theme = useTheme();
    const { car = {} } = props;
    const { service_orders = [], stock } = car;
    const custID = undefined;

    const updater = (table, data) => firebase.firestore().collection(table).doc().set(data, {merge: true});

    const makeOrder = () => {
      const new_orders = [...service_orders, {name: `${stock} Order #${service_orders.length + 1}`, date: moment().format("YYYY/MM/DD")}];
      StateManager.setCar({...car, service_orders: new_orders});
    }

    const makeService = (order_index) => {
      console.log(order_index);
      let new_orders = [...service_orders];
      new_orders[order_index].services = [...(new_orders[order_index].services || []), {}];
      StateManager.setCar({...car, service_orders: new_orders});
    }

    const updateOrder = (params) => {
      const {order_index, service_index = -1, property, value = ""} = params;
      let new_orders = [...service_orders];

      if(service_index < 0 ) new_orders[order_index][property] = value;
      else new_orders[order_index].services[service_index][property] = value;

      StateManager.setCar({...car, service_orders: [...new_orders]});
    }

    const submitOrder = async (order_index) => {
      let order = service_orders[order_index];
      order.services = (order.services || []).filter(x => !!x.name);
      if(order.services.length < 1) return StateManager.setAlertAndOpen("Order must have services to save", "error");
      if(!order.name) return StateManager.setAlertAndOpen("Order must have a name to save", "error");

      StateManager.setLoading(true);
      const response = await RequestManager.post({function: "makeOrderWithServices", variables: {stock, order, custID}});
      order.shopmonkeyId = response.data.shopmonkeyId;
      order.isSaved = true;

      StateManager.setCar({...car, service_orders: [...service_orders]});
      updater("service_orders", {stock, ...order});
      StateManager.setLoading(false);
      StateManager.setAlertAndOpen("Order saved!", "success");
    }

    const deleteOrder = (order_index) => {
      if (window.confirm("Are you sure you want to delete this?")) {
        let order = service_orders[order_index];
        const new_orders = service_orders.filter(x => x.id !== order.id);

        StateManager.setCar({...car, service_orders: [...new_orders]});
        firebase.firestore().doc(`service_orders/${order.id}`).delete();
      }
    }

    // console.log("here", service_orders);
    return (
        <>
          <Typography variant={"h5"} align="left" style={{padding: 7}}>
            {formatTitle("service-orders")}
          </Typography>
          {
            service_orders.length < 1 && (
              <PaperDiv>
                <Typography variant={"h6"} align="left" style={{padding: 7}}>
                  No active orders
                </Typography>
              </PaperDiv>
            )
          }
          {
            service_orders.map((order, i) => {
              const {name, services = [], workflow = "estimate"} = order;
              const components = services.map((service, j) => {
                const onServiceChange = (id, value) => updateOrder({order_index: i, service_index: j, property: "name", value});
                return (
                  <TextLine 
                    data={service} 
                    id={`name`}
                    idOverride={`service-${j}`} 
                    removeCheck 
                    placeholder="Service name" 
                    maxWidth={"100%"} 
                    onChange={onServiceChange} 
                    alignment="left"
                    disabled={order.isSaved}
                    InputProps={{ style:{color: "black"} }}
                  />
                )
              })

              const label = (
                <div onClick={(e) => e.stopPropagation()}>
                  <TextField
                    onChange={(e) => updateOrder({order_index: i, property: "name", value: e.target.value})}
                    id={"order-name"} 
                    name={"order-name"}
                    value={name}
                    placeholder={"Add order name"} 
                    multiline={true} 
                    disabled={order.isSaved}
                    InputProps={{ disableUnderline: true, style:{color: "black", fontSize:18, fontWeight: "bold"} }}
                    fullWidth
                  />
                </div>
              )

              return (
                <Dropdown id={name} label={label} expand={!order.isSaved} value={formatTitle(workflow)} >
                  <Typography variant={"p"} align="left" style={{paddingBottom: 7}}>
                    Order Date: {moment(order.date).format("MM/DD/YYYY")}
                  </Typography>
                  <Typography variant={"p"} align="left" style={{paddingBottom: 7}}>
                    Status: {formatTitle(workflow)}
                  </Typography>
                  {
                    (order.isSaved && !order.note) || (
                      <TextField
                        value={order.note}
                        onChange={(e) => updateOrder({order_index: i, property: "note", value: e.target.value})}
                        id={"order-note"} 
                        name={"order-note"}
                        // label={"Order Note"}
                        placeholder="Add order note" 
                        multiline={true} 
                        disabled={order.isSaved}
                        InputProps={{ disableUnderline: true, style: {color: 'black'}}}
                        fullWidth
                      />
                    )
                  }
                  {components}
                  <div style={{marginTop: 10}}>
                    {
                      !order.isSaved ? (
                        <>
                          <Button variant="contained" color="secondary" onClick={() => makeService(i)}>
                              Add service
                          </Button>
                          <Button variant="contained" color="primary" onClick={() => submitOrder(i)}>
                              Save Order
                          </Button>
                        </>
                      )
                      : (
                        <Button variant="contained" onClick={() => deleteOrder(i)} style={{backgroundColor: theme.palette.error.main,}}>
                            Delete Serivce Order
                        </Button>
                      )
                    }
                    
                  </div>
                </Dropdown>
              )

            })
          }
          <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={makeOrder}>
                Make new order
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