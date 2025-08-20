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
import TextLine from '../../components/TextLine.js';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import Transactions from './Transactions.js';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import SelectLine from '../../components/SelectLine.js';
import FundingSummary from './FundingSummary.js';
import Check from '../../components/Check.js';
import PaymentLine from '../../components/PaymentLine.js';
import constants from '../../utilities/constants.js';
import BankSelectorDialog from '../../components/BankSelectorDialog.js';

export default function Sales(props) {
    const { car = {} } = props;
    const stockNumber = car.stock;
    const deal = car.deal || {};
    const invoices = car.invoices || [];
    const shipping_invoices = car.shipping_invoices || [];
    const signers = [car.buyer, car.cobuyer].filter(x => !!x);
    
    // State for bank selector dialog
    const [bankDialogOpen, setBankDialogOpen] = React.useState(false);

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

    const startSigning = async () => {
        StateManager.setLoading(true);
        const pdfDoc = await getJacketPDF();
        const signerKeys = [ 'email', 'display_name', 'first_name', 'last_name' ];
        let cleanSigners = [
            // {email: "ryan@skywayclassics.com", display_name: "Ryan Tanski", first_name: "Ryan", last_name: "Tanski"},
            ...signers
        ];
        cleanSigners = cleanSigners.map(signer => {
            Object.keys(signer).forEach((key) => signerKeys.includes(key) || delete signer[key])
            return signer;
        }).filter(x => Object.keys(x).length > 0);

        const parameters = {
            function: "getSignatures",
            variables: {
              file_from_url: pdfDoc.file,
              signers: cleanSigners,
              name: `${car.year} ${car.make} ${car.model} Deal Packet`,
              subject: `${car.year} ${car.make} ${car.model} Deal Packet`,
              events_callback_url: process.env.NODE_ENV === 'development'
                ? `https://8b1b51767223.ngrok.io/skyway-dev-373d5/us-central1/processSignRequestEvent?type=sales&table=cars&ref=stock&id=${stockNumber}`
                : `https://us-central1-skyway-dev-373d5.cloudfunctions.net/processSignRequestEvent?type=sales&table=cars&ref=stock&id=${stockNumber}`,
            }
        };

        let respsonse = await RequestManager.post(parameters);
        
        if(respsonse.status == 'complete'){
            StateManager.setAlertMessage('Packet Sent!');
        }
        else{
            StateManager.setAlertSeverity("error");
            StateManager.setAlertMessage('Hmm... there was an error.')
        }
        StateManager.setLoading(false);
        StateManager.openAlert(true);
    };

    const sendCreditApp = async (selectedBanks) => {
        StateManager.setLoading(true);
        try {
            const parameters = {
                function: "sendCreditApp",
                variables: {
                    stockNumber: stockNumber,
                    customerId: car.buyer?.id,
                    invoiceId: deal.invoice,
                    banks: selectedBanks
                }
            };

            const response = await RequestManager.post(parameters);
            
            if (response.success !== false) {
                StateManager.setAlertMessage('Credit application sent successfully!');
                StateManager.setAlertSeverity("success");
            } else {
                StateManager.setAlertSeverity("error");
                StateManager.setAlertMessage('Error sending credit application. Please try again.');
            }
        } catch (error) {
            console.error('Error sending credit app:', error);
            StateManager.setAlertSeverity("error");
            StateManager.setAlertMessage('Error sending credit application. Please try again.');
        } finally {
            StateManager.setLoading(false);
            StateManager.openAlert(true);
        }
    };

    const updateSource = (target, id, value) => {
      let newCar = {...car};
      newCar[target] = {...newCar[target], [id]: value};
      car.updater(newCar);
    }

    const updater = (id, value) => {
      firebase.firestore().doc('deals/'+stockNumber).set({[id]: value}, {merge: true});
      updateSource("deal", id, value)
    }

    const dateUpdate = async (id, date) => {
        let update = {
          [id]: !date ? "" : moment(date).format('MM-DD-YYYY'),
          month: !date ? "" : moment(date).format('YYYY-MM'),
          title_status: !date ? firebase.firestore.FieldValue.delete() : constants.title_statuses[0],
          shipping_status: !date ? firebase.firestore.FieldValue.delete() : constants.shipping_statuses[0],
        }

        await firebase.firestore().doc('deals/'+stockNumber).set(update, {merge:true});
        updateSource("deal", id, date);
    }

    const activeInvoice = car.invoices.filter(x => x.id === car.deal.invoice)[0] || {};
    const depositLimit = activeInvoice.total || 0;

    const paymentDescription = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
    const reason = `Please use this link to make a deposit on the ${paymentDescription}`;
    const item = [{desc: "Sales Deposit"}];

    let keysToRemove = [];
    if(!StateManager.isBackoffice()) {
      keysToRemove=[
        // "expenses",
        // "profit", 
      ];

      if(!!deal.sales_rep && deal.sales_rep !== StateManager.userName){
        keysToRemove = [
          ...keysToRemove,
          "sales-rep",
          "invoices",
          "trades",
          "deposits",
          "payment",
        ];
      }
    }

    const disabled = ["sold", "terminated"].includes(car.status) && !StateManager.isAdmin();

    const minDate = !StateManager.isAdmin();

    const sections = {
        'date': () => <DateLine id={'date'} label={'Sale Date'} data={deal} updater={dateUpdate} minDate={minDate} drop_is disabled={disabled}/>,
        'sales-rep': () => <SelectLine id={'sales_rep'} label='Sales Rep' data={deal} updater={updater} selections={constants.sales_team.map(name => ({value: name, label: name}))} disabled={disabled} />,
        // 'delivery-date': () => <DateLine id={'delivery_date'} label={'Expected Delivery'} data={deal} updater={dateUpdate} minDate drop_is/>,
        'buyer': () => <Customers customer={car.buyer} stockNumber={stockNumber} type='buyer' disabled={disabled}/>,
        'buyer-license': () => car.buyer && car.buyer.id ? <NewFileLine id={"license"} label={"Buyer's License"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer}  disabled={disabled} /> : null,
        'buyer-license-back': () => car.buyer && car.buyer.id ? <NewFileLine id={"license_back"} label={"Buyer's License Back"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer}  disabled={disabled} /> : null,
        // 'buyer-insurance': () => <NewFileLine id={"insurance"} label={"Buyer's Insurance"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.buyer.id}`} data={car.buyer} />,
        'cobuyer': () => <Customers customer={car.cobuyer} stockNumber={stockNumber} type='cobuyer' disabled={disabled}/>,
        'cobuyer-license': () => car.cobuyer && car.cobuyer.id ? <NewFileLine id={"license"} label={"Cobuyer's License"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.cobuyer.id}`} data={car.cobuyer}  disabled={disabled} /> : null,
        // 'is-finance': () => <Check id={"is_finance"} label={"Is Finance Deal?"} data={deal} updater={updater} value={deal.is_finance ? "Yes" : "No"}/>, 
        'trades': () => <Trades deal={{...deal, car: stockNumber}} disabled={disabled}/>, 
        'invoices': () => <Invoices invoices={invoices} deal={deal} stockNumber={stockNumber} disabled={disabled}/>, 
        'deposits': () => <Transactions items={car.deposits} stockNumber={car.stock} checkLimit={depositLimit} type="deposits" disabled={disabled} showSummary/>,
        'funding': () => activeInvoice && activeInvoice.total ? <FundingSummary revenue={activeInvoice.total} deposits={car.deposits}/> : null, 
        'payment': () => <PaymentLine enable label="Get Deposit" items={item} reference={stockNumber} customer={car.buyer} type="sales" title={paymentDescription} thumbnail={car.thumbnail} reason={reason} />,
        // 'shipping': () => <Invoices type="shipping" invoices={shipping_invoices} deal={deal} stockNumber={stockNumber}/>, 
        // 'financier': () => <SelectLine id={'lien_holder'} label='Financier' data={car.title} selections={"banks"} updater={titleUpdater} />, 
        // 'expenses': () => <ExpensesSummary expenses={car.expenses}/>, 
        'expenses': () => <Transactions items={car.expenses} stockNumber={car.stock} type="expenses" disabled={disabled} showSummary/>,
        'profit': () => activeInvoice && activeInvoice.revenue ? <ProfitSummary revenue={activeInvoice.revenue} expenses={car.expenses}/> : null, 
        'signed-packet': () => <NewFileLine id={"sales_doc"} label={"Signature Status"} allowable="imageLike" folder="deals" saveLocation={`cars/${car.id}`} data={car} removeDelete />,
    }.filterKeys(keysToRemove);

    // Add new function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    // Add new function to calculate total deposits
    const getTotalDeposits = () => {
        return (car.deposits || []).reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
    };

    // Add new function to calculate total expenses
    const getTotalExpenses = () => {
        return (car.expenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
    };

    // Add profit calculation function
    const calculateProfit = () => {
        const revenue = activeInvoice?.revenue || 0;
        const expenses = getTotalExpenses();
        return revenue - expenses;
    };

    return (
        <div>
          <div 
            className="no-print"
            style={{
              backgroundColor: 'white', 
              padding: '17px', 
              marginBottom: "3px",
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between',
              borderBottomWidth: '3px' 
            }}
          >
            <FormControlLabel control={<Checkbox checked={true} />} label={'Car'} />
            <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end"}}>
              {car.thumbnail && <img style={{ height: 120, width: 160 }} src={car.thumbnail} />}
              <h3>{car.year || ""} {car.make || ""} {car.model || ""}</h3>
            </div>
          </div>
          <div style={{paddingBottom: 15}} className="no-print">
            {
              Object.keys(sections).map((section, i) => {
                const sectionComponent = sections[section]();
                return sectionComponent ? (
                  <div key={section} style={{marginBottom: '3px'}}>
                      {sectionComponent}
                  </div>
                ) : null;
              })
            }
          </div>
          <div className="section-to-print sales-summary-print hidden-ro-print">
            <h2>Vehicle Sales Summary</h2>
            
            <div className="header-section">
                <div className="vehicle-info">
                    <div className="detail-row">
                        <strong>Vehicle</strong> {car.year} {car.make} {car.model}
                    </div>
                    <div className="detail-row">
                        <strong>Stock Number</strong> {stockNumber}
                    </div>
                    <div className="detail-row">
                        <strong>Sales Rep</strong> {deal.sales_rep || 'N/A'}
                    </div>
                    <div className="detail-row">
                        <strong>Sale Date</strong> {deal.date || 'N/A'}
                    </div>
                    <div className="detail-row">
                        <strong>Customer</strong> {car.buyer?.display_name || 'N/A'}
                    </div>
                </div>
                
                {car.thumbnail && (
                    <div className="image-container">
                        <img src={car.thumbnail} alt="Vehicle" />
                    </div>
                )}
            </div>

            <div className="financial-section">
                <div className="detail-row">
                    <strong>Invoice Amount</strong> {formatCurrency(activeInvoice?.total || 0)}
                </div>
                <div className="detail-row">
                    <strong>Total Deposits</strong> {formatCurrency(getTotalDeposits())}
                </div>
                <div className="detail-row">
                    <strong>Total Expenses</strong> {formatCurrency(getTotalExpenses())}
                </div>
                <div className="detail-row profit-row">
                    <strong>Total Profit</strong> {formatCurrency(calculateProfit())}
                </div>
            </div>
            
            {/* Expenses Detail - now starts on new page */}
            {car.expenses && car.expenses.length > 0 && (
                <div className="expenses-section">
                    <h3>{car.stock} {car.year || ""} {car.make || ""} {car.model || ""}</h3>
                    <h4>Expense Details</h4>
                    {car.expenses.map((expense, index) => (
                        <div key={index} className="expense-item">
                            <span>{expense.memo}</span>
                            <span>{formatCurrency(expense.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="no-print">
            <Button variant="contained" color="secondary" onClick={viewPDF}>
                Preview Packet
            </Button>
            <Button variant="contained" color="primary" onClick={startSigning}>
                Send for Signature
            </Button>
            {car.buyer?.credit_app && (
              <Button 
                variant="contained" 
                color="success" 
                onClick={() => setBankDialogOpen(true)}
                disabled={disabled}
                style={{ marginLeft: 8 }}
              >
                Send Credit App
              </Button>
            )}
          </div>
          
          {/* Bank Selector Dialog */}
          <BankSelectorDialog
            open={bankDialogOpen}
            onClose={() => setBankDialogOpen(false)}
            onSend={sendCreditApp}
            car={car}
            disabled={disabled}
          />
        </div>
        );
}

function validateForm(data){
    let message = false;
    if(!data.deal.date) message = "Missing Date";
    // else if(!data.deal.delivery_date) message = "Missing Expected Delivery Date";
    else if(!data.buyer) message = "Missing Buyer Data";
    else if(!data.buyer?.email) message = "Missing Buyer Email";
    // else if(!data.buyer?.insurance) message = "Missing Buyer Insurance";
    else if(!data.buyer?.license) message = "Missing Buyer Driver License";
    else if(!data.buyer?.license_back) message = "Missing Back of Buyer Driver License";
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