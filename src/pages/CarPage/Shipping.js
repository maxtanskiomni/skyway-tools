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
import Transactions from './Transactions.js';
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
import TextLine from '../../components/TextLine.js';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import SelectLine from '../../components/SelectLine.js';
import PaymentLine from '../../components/PaymentLine.js';
import Check from '../../components/Check.js';

export default function Sales(props) {
    const { car = {} } = props;
    const stockNumber = car.stock;
    const deal = car.deal || {};
    const shipping_invoices = car.shipping_invoices || [];

    const getJacketPDF = async () => {
        if(!validateForm(car)) return;
        const params = {
          function: "preparePDF",
          variables: {
            stockNumber,
          }
        };
        let preparePDF = await RequestManager.get(params);
        return preparePDF;
    }

    const viewPDF = async () => {
        StateManager.setLoading(true);
        const pdfDoc = await getJacketPDF();
        let pdfLink = document.createElement('a');
        if(pdfDoc.file === undefined){
          StateManager.setAlertAndOpen("Hmm.. there was an error", "error");
        }else {
          pdfLink.href = pdfDoc.file;
          pdfLink.target = "_blank";
          pdfLink.click();
        }

        StateManager.setLoading(false);
    };

    const sendInvoice = () => null;

    const updater = (id, value) => {

      let update = {[id]: value};
      if(id === "complete" && !value) update.shipping_status = "pending";
      else if(id === "complete" && value) update.shipping_status = "complete";

      firebase.firestore().doc('deals/'+stockNumber).set(update, {merge: true})
    };

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('MM-DD-YYYY')}
        if(id == "shipping_date") update.shipping_month = !date ? "" : moment(date).format('YYYY-MM');
        await firebase.firestore().doc('deals/'+stockNumber).set(update, {merge:true});
    }

    const activeInvoice = car.shipping_invoices.filter(x => x.id === car.deal.shipping)[0] || {};
    const amountOwed = activeInvoice.price - car.shipping_deposits.reduce((a,c) => a + (c.amount || 0), 0);
    const depositLimit = activeInvoice.total || 0;
    const paymentDescription = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;

    const keysToRemove = StateManager.isBackoffice() ? [] : [
      "deposits",
      "expenses",
      "profit", 
    ];

    const sections = {
        'date': () => <DateLine id={'shipping_date'} label={'Shipping Date'} data={deal} updater={dateUpdate} minDate drop_is/>,
        'buyer': () => <Customers customer={car.buyer} stockNumber={stockNumber} type='buyer'/>,
        'buyer-insurance': () => <NewFileLine id={"insurance"} label={"Buyer's Insurance"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer} />,
        'deal-temp-tag': () => <NewFileLine id={"temp_tag"} label={"Temp Tag"} allowable="imageLike" folder="temp_items" saveLocation={`deals/${stockNumber}`} data={deal} />,
        'deal-temp-registration': () => <NewFileLine id={"temp_registration"} label={"Temp Registration"} allowable="imageLike" folder="temp_items" saveLocation={`deals/${stockNumber}`} data={deal} />,
        'shipping': () => <Invoices type="shipping" invoices={shipping_invoices} deal={deal} stockNumber={stockNumber}/>, 
        'deposits': () => <Transactions items={car.shipping_deposits} stockNumber={car.stock} checkLimit={depositLimit} type="deposits" group="shipping"/>,
        'expenses': () => <Transactions items={car.shipping_expenses} stockNumber={car.stock} type="expenses" group="shipping" disabled={false}/>,
        'profit': () => <ProfitSummary revenue={activeInvoice.total} expenses={car.shipping_expenses}/>, 
        'bill-of-laden': () => <NewFileLine id={"bill_of_laden"} label={"Bill of Laden"} allowable="imageLike" folder="shipping" saveLocation={`cars/${stockNumber}`} data={car} />,
        'payment': () => <PaymentLine label="Amount Owed" items={[{desc: "Shipping", amount: amountOwed}]} reference={stockNumber} customer={car.buyer} type="shipping" title={paymentDescription} thumbnail={car.thumbnail} />,
        'complete': () => <Check id={'shipping_complete'} label={'All Tasks Complete'} data={deal} updater={updater} />,
      }.filterKeys(keysToRemove);

    return (
        <div>
            <div style={{
              backgroundColor: 'white', 
              padding: '17px', 
              marginBottom: "3px",
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottomWidth: '3px' 
            }}>
              <FormControlLabel control={<Checkbox checked={true} />} label={'Car'} />
              <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end"}}>
                {car.thumbnail && <img style={{ height: 120, width: 160 }} src={car.thumbnail} />}
                <h3>{car.year || ""} {car.make || ""} {car.model || ""}</h3>
              </div>
            </div>
            <div style={{paddingBottom: 15}}>
              {
                Object.keys(sections).map((section, i) => 
                    <div style={{marginBottom: '3px'}}>
                        {sections[section]()}
                    </div>
                )
              }
            </div>
            {/* <Button variant="contained" color="secondary" onClick={viewPDF}>
                Preview Invoice
            </Button>
            <Button variant="contained" color="primary" onClick={sendInvoice}>
                Send to Customer
            </Button> */}
        </div>
        );
}

function validateForm(data){
    let message = false;
    if(!data.deal.date) message = "Missing Date";
    else if(!data.deal.delivery_date) message = "Missing Expected Delivery Date";
    else if(!data.buyer) message = "Missing Buyer Data";
    else if(!data.buyer?.email) message = "Missing Buyer Email";
    // else if(!data.buyer?.insurance) message = "Missing Buyer Insurance";
    else if(!data.buyer?.license) message = "Missing Buyer Driver License";
    else if(!data.deal.invoice) message = "Missing Invoice Data";
    else if(!data) message = "Missing Car Data";
    else if(!data.year) message = "Missing Car Year";
    else if(!data.make) message = "Missing Car Make";
    else if(!data.model) message = "Missing Car Model";
    else if(!data.vin) message = "Missing VIN";
    else if(!data.miles) message = "Missing Miles";
    else if(!data.color) message = "Missing Color";

    //if cobuyer exists
    if(Object.keys(data.cobuyer).length > 0){
      if(!data.cobuyer?.email) message = "Missing Cobuyer Email";
      else if(!data.cobuyer?.license) message = "Missing Cobuyer Driver License";
    }
    if(!message) return "success";

    StateManager.setLoading(false);
    StateManager.setAlertAndOpen(message, "error")
}