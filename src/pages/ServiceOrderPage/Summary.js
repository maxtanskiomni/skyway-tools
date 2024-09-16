import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Customers from './Customers.js';
import ProfitSummary from './ProfitSummary.js';
import firebase from '../../utilities/firebase.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FundingSummary from '../../components/FundingSummary.js';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import Transactions from './Transactions.js';
import { StateManager } from '../../utilities/stateManager.js';
import RequestManager from '../../utilities/requestManager.js';

import constants from '../../utilities/constants.js';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import SelectLine from '../../components/SelectLine.js';
import Check from '../../components/Check.js';
import Cars from './Cars.js';
import PaymentLine from '../../components/PaymentLine.js';
import { Button } from '@mui/material';
import UploadLine from '../../components/UploadLine.js';
import TextLine from '../../components/TextLine.js';
import history from '../../utilities/history.js';

export default function Summary(props) {
    const { order = {} } = props;
    const {car = {}, customer = {} } = order;
    const stockNumber = order.stock;
    const [revenue, setRevenue] = React.useState(order.revenue || 0);

    const updateSource = (target, id, value) => {
      let newOrder = {...order};
      newOrder[target] = {...newOrder[target], [id]: value};
      StateManager.updateCar(newOrder);
    }

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('YYYY-MM-DD')}
        if(id == "complete_date") update.month = !date ? "" : moment(date).format('YYYY-MM');
        await firebase.firestore().doc('orders/'+stockNumber).set(update, {merge:true});
        updateSource("deal", id, date);
    };

    const statusUpdater = async (id, value) => {
      const update = {status: value, status_time: moment().format("YYYY/MM/DD")};

      if(value === "complete" && customer.display_name === "Skyway Classics"){
        //Add deposit for full value 
        const date = moment().format('YYYY/MM/DD');
    
        //Create deposit
        const deposit = {
          type: "service",
          date,
          stock: stockNumber,
          account: "trade",
          amount: revenue,
          memo: "TFD - Transfer from deal",
        }
        await firebase.firestore().collection("deposits").doc().set(deposit, {merge: true});

        //Create expense
        const expense = {
          paidDate: date,
          date: moment().format('MM/DD/YYYY'),
          isPayable: false,
          stock: car.stock,
          account: "trade",
          amount: revenue,
          memo: stockNumber,
          vendor: "Skyway Classics"
        }
        await firebase.firestore().collection("purchases").doc(stockNumber).set(expense, {merge: true});
        
        //Update the status if one is not there;
        if(!order.complete_date) await dateUpdate("complete_date", date);
      }

      //Update the status
      await firebase.firestore().doc('orders/'+stockNumber).set(update, {merge: true});
    }

    
    const pictureUpload = async (files) => {
      const [thumbnail, ...rest] = files;
      const update = {thumbnail};
      await firebase.firestore().doc('orders/'+stockNumber).set(update, {merge: true});
      StateManager.updateCar(update);
    }

    const depositsAmount = order.deposits.reduce((a,c) => a + (c.amount || 0), 0);

    const neg_expenses = [...order.services.map(x => ({amount: -(x.cost || 0)})), ...order.expenses.map(x => ({amount: -(x.amount || 0)}))];
    const expenses = [...order.services.map(x => ({amount: (x.cost || 0)})), ...order.expenses.map(x => ({amount: (x.amount || 0)}))];

    const paymentDescription = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;

    const updater = (id, value) => {
      value = value || "";
      if(id === "revenue") {
        //Set revenue on page
        value = Number(value.replace(/,/g, "").replace("$", ""));
        setRevenue(value);
        StateManager.setPaymentLineAmount(value - depositsAmount);

        //Sync bill to stock number if skyway is customer
        if(customer.display_name === "Skyway Classics"){
          const expense = {
            date: moment().format('MM/DD/YYYY'),
            isPayable: true,
            stock: car.stock,
            account: "trade",
            amount: value,
            memo: stockNumber,
            vendor: "Skyway Classics"
          }
          firebase.firestore().collection("purchases").doc(stockNumber).set(expense, {merge: true});
        }
      }
      firebase.firestore().doc('orders/'+stockNumber).set({[id]: value}, {merge: true});
      let newOrder = {...order, [id]: value};
      props.updater(newOrder);
    }

    const deleteSO = async () => {
      if(neg_expenses < 0){
        window.alert("You cannot delete and SO that has expenses attached to it.");
        return;
      }

      if (window.confirm("Are you sure you want to delete this?")) {
        StateManager.setLoading(true);
        await firebase.firestore().doc("orders/"+stockNumber).delete();
        history.push("/service-pipeline")
      }
    }

    const activeSelections = constants.makeSelects("order_statuses", undefined, (status) => customer.display_name === "Skyway Classics" || revenue<=depositsAmount || status !== "complete");

    const sections = {
        'date': () => <DateLine id={'date'} label={'Start Date'} data={order} updater={dateUpdate} minDate drop_is disabled={order.disabled} />,
        'target-date': () => StateManager.userType === "admin" ? <DateLine id={'target_date'} label={'Target Date'} data={order} updater={dateUpdate} minDate drop_is disabled={order.disabled}/> : <></>,
        'complete-date': () => <DateLine id={'complete_date'} label={'Complete Date'} data={order} updater={dateUpdate} minDate drop_is disabled={order.disabled}/>,
        'writer': () => <TextLine id={'writer'} label='Service Writer' data={order} updater={updater} placeholder="Service Writer" disabled={order.disabled} />,
        'customer': () => <Customers customer={order.customer} stockNumber={stockNumber} type='customer' table="orders" disabled={order.disabled}/>,
        'car': () => <Cars car={order.car} stockNumber={stockNumber} type='car' table="orders" disabled={order.disabled}/>,
        "status": () => <SelectLine id={'status'} label={'Status'} selections={activeSelections} data={order} updater={statusUpdater} disabled={order.disabled} />,
        'revenue': () => StateManager.isBackoffice() ? <TextLine id={'revenue'} label='Revenue' data={order} updater={updater} placeholder="Revenue" disabled={order.disabled} /> : <></>,
        // 'revenue': () => <ProfitSummary label={"Revenue"} revenue={revenue} expenses={[]} expose/>, 
        'deposits': () => <Transactions items={order.deposits} stockNumber={order.stock} checkLimit={revenue || 0} type="deposits" group="service" disabled={order.disabled} showSummary/>,
        'expenses': () => <ProfitSummary label={"Expenses"} expenses={neg_expenses} disabled={order.disabled} expose/>,
        'funding': () => <FundingSummary revenue={revenue} deposits={order.deposits} disabled={order.disabled}/>, 
        'profit': () => <ProfitSummary revenue={revenue} expenses={expenses} disabled={order.disabled}/>, 
        'payment': () => <PaymentLine enable={revenue>depositsAmount} label="Amount Owed" revenue={revenue} deposits={depositsAmount} reference={order.stock} customer={order.customer} type="service" title={paymentDescription} thumbnail={order.thumbnail} disabled={order.disabled} />,
    };

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
            <FormControlLabel control={<Checkbox checked={true} />} label={'Service Order'} />
            <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end"}}>
              {order.thumbnail &&
                <a target="_blank" href={order.car ? `/car/${order.car.stock}` : null}>
                  <img style={{ height: 120, width: 160, objectFit: "cover" }} src={order.thumbnail} />
                </a>
              }
              <h3 style={{textDecoration: "none"}}>{order.stock || ""}</h3>
              <UploadLine folder="images" bucket="public" multiple={false} cta={order.thumbnail ? "Update Picture" : "Add Picture"} callback={pictureUpload}/>
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
              Preview Packet
          </Button>
          <Button variant="contained" color="primary" onClick={startSigning}>
              Send for Signature
          </Button> */}
          <div>
            {
              StateManager.isAdmin() && (
                <Button variant="contained" color="primary" onClick={deleteSO}>
                  Delete SO
                </Button>
              )
            }
          </div>
        </div>
        );
}