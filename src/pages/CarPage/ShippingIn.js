import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Customers from './Customers.js';
import Invoices from './Invoices.js';
import ProfitSummary from './ProfitSummary.js';
import Transactions from './Transactions.js';
import firebase from '../../utilities/firebase.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager.js';

import moment from 'moment';
import PaymentLine from '../../components/PaymentLine.js';
import Check from '../../components/Check.js';

export default function Sales(props) {
    const { car = {} } = props;
    const stockNumber = car.stock;
    const deal = car.deal || {};
    const shipping_invoices = car.shipping_in_invoices || [];

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('MM-DD-YYYY')}
        if(id == "shipping_in_date") update.shipping_in_month = !date ? "" : moment(date).format('YYYY-MM');
        await firebase.firestore().doc('deals/'+stockNumber).set(update, {merge:true});
    }

    const activeInvoice = shipping_invoices.filter(x => x.id === car.deal.shipping_in)[0] || {};
    const amountOwed = activeInvoice.price - car.shipping_deposits.reduce((a,c) => a + (c.amount || 0), 0);
    const depositLimit = activeInvoice.total || 0;
    const paymentDescription = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;

    const keysToRemove = StateManager.isBackoffice() ? [] : [
      "deposits",
      "expenses",
      "profit", 
    ];

    const sections = {
        'date': () => <DateLine id={'shipping_in_date'} label={'Shipping Date'} data={deal} updater={dateUpdate} drop_is/>,
        'shipping': () => <Invoices type="shipping_in" invoices={shipping_invoices} deal={deal} stockNumber={stockNumber}/>, 
        'deposits': () => <Transactions items={car.shipping_in_deposits} stockNumber={car.stock} checkLimit={depositLimit} type="deposits" group="shipping_in"/>,
        'expenses': () => <Transactions items={car.shipping_in_expenses} stockNumber={car.stock} type="expenses" group="shipping_in" disabled={false}/>,
        'profit': () => <ProfitSummary revenue={activeInvoice.total} expenses={car.shipping_in_expenses}/>, 
        'bill-of-laden': () => <NewFileLine id={"ship_in_bill_of_laden"} label={"Bill of Laden"} allowable="imageLike" folder="shipping_in" saveLocation={`cars/${stockNumber}`} data={car} />,
        'payment': () => <PaymentLine label="Amount Owed" items={[{desc: "Shipping", amount: amountOwed}]} reference={stockNumber} customer={car.buyer} type="shipping_in" title={paymentDescription} thumbnail={car.thumbnail} />,
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
        </div>
        );
}