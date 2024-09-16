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
import NewFileLine from '../../components/NewFileLine.js';
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
import FileLine from '../../components/FileLine.js';
import Transactions from './Transactions.js';
import NoteLine from '../../components/NoteLine.js';

export default function Finance(props) {
    const { car = {} } = props;
    const stockNumber = car.stock;
    const deal = car.deal || {};
    const invoices = car.finance_invoices || [];

    const activeInvoice = invoices.filter(x => x.id === car.deal.finance)[0] || {};
    const depositLimit = activeInvoice.total || 0;

    const updateSource = (target, id, value) => {
      let newCar = {...car};
      newCar[target] = {...newCar[target], [id]: value};
      car.updater(newCar);
    }

    const updater = (id, value) => firebase.firestore().doc('cars/'+stockNumber).set({[id]: value}, {merge: true});
    const dealUpdater = (id, value) => {
      firebase.firestore().doc('deals/'+stockNumber).set({[id]: value}, {merge: true});
      updateSource("deal", id, value)
    }

    const sections = {
        'is-finance': () => <Check id={"is_finance"} label={"Is Finance Deal?"} data={deal} updater={dealUpdater} value={deal.is_finance ? "Yes" : "No"}/>, 
        'app-sent': () => <DateLine id={'app_sent_customer'} label={'App Sent to Customer'} data={car} updater={updater} />,
        // 'app-received': () => <DateLine id={'app_received'} label={'App Received'} data={car} single={true} />,
        'buyer-license': () => <NewFileLine id={"license"} label={"Buyer's License"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer} />,
        'buyer-license-back': () => <NewFileLine id={"license_back"} label={"Buyer's License Back"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer} />,
        // 'app-sent-bank': () => <DateLine id={'app_sent_underwriting'} label={'App Sent to Banks'} data={car} single={true} />,
        'app-sent-bank': () => <NoteLine id={stockNumber} label={'App Sent to Banks'} table={"deals"} data={deal} property="banks" entity="bank" />,
        'is-approved': () => <Check id={"approved"} label={"Customer Approved"} data={deal} updater={dealUpdater} value={deal.approved ? "Yes" : "No"}/>, 
        'app-sent-strips': () => <NoteLine id={stockNumber} label={'Stips Needed'} table={"deals"} data={deal} property="stips" entity="stip" />,
        'buyer-insurance': () => <NewFileLine id={"insurance"} label={"Buyer's Insurance"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer} />,
        // 'docs-sent': () => <DateLine id={'docs_sent'} label={'Sent for Signature'} data={car} updater={updater} />,
        // 'docs-signed': () => <DateLine id={'docs_signed'} label={'Loan Docs Signed'} data={car} updater={updater} />,
        'funding-strips': () => <NoteLine id={stockNumber} label={'Funding Stips'} table={"deals"} data={deal} property="funding_stips" entity="stip" />,
        'invoice': () => <Invoices type="finance" invoices={invoices} deal={deal} stockNumber={stockNumber}/>, 
        'deposits': () => <Transactions items={car.finance_deposits} stockNumber={car.stock} checkLimit={depositLimit} type="deposits" group="finance"/>,
        'complete': () => <Check id={'finance_complete'} label={'All Tasks Complete'} data={car} updater={updater} />,
    };

    return (
        <>
            {
              Object.keys(sections).map((section, i) => 
                  <div style={{marginBottom: '3px'}}>
                      {sections[section]()}
                  </div>
              )
            }
        </>
        );
}