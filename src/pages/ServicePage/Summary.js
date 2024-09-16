import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Customers from './Customers.js';
import ProfitSummary from './ProfitSummary.js';
import firebase from '../../utilities/firebase.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextLine from '../../components/TextLine.js';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import Transactions from './Transactions.js';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager.js';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import SelectLine from '../../components/SelectLine.js';
import Check from '../../components/Check.js';
import Cars from './Cars.js';
import constants from '../../utilities/constants.js';
import LaunchIcon from '@mui/icons-material/Launch';
import { Button } from '@mui/material';
import history from '../../utilities/history.js';

export default function Summary(props) {
    const { data = {} } = props;
    const {order = {}} = data;
    const stockNumber = order.id;

    const orderURL = stockNumber && `/service-order/${stockNumber}`;
    const carURL = order.car && `/car/${order.car}`;

    const updateSource = (target, id, value) => {
      let newOrder = {...data};
      newOrder[target] = {...newOrder[target], [id]: value};
      StateManager.updateCar(newOrder);
    }

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('YYYY-MM-DD')}
        await firebase.firestore().doc('orders/'+stockNumber).set(update, {merge:true});
        updateSource("deal", id, date);
    }

    const updater = (id, value) => firebase.firestore().doc('services/'+data.id).set({[id]: value}, {merge: true});

    const orderUpdater = (id, value) => firebase.firestore().doc('services/'+data.id).set({"order": value}, {merge: true});

    const mechUpdater = (id, value) => {
        let update = {[id]: value || ""};
        let settings = constants.mechanics.filter(rep => rep.name === value).at(0) || {};
        update.mechanicID = settings.id || "";
        update.rate = settings.rate || "";
        update.cost = (update.rate || 0) * data.time;
        firebase.firestore().doc('services/'+data.id).set(update, {merge: true});
    }

    const timeUpdater = (id, value) => {
        let update = {[id]: value || 0};
        update.cost = value * (data.rate || 0);
        firebase.firestore().doc('services/'+data.id).set(update, {merge: true});
    }

    const statusUpdater = (id, value) => {
      const update = {status: value, status_time: moment().format("YYYY/MM/DD")};
      firebase.firestore().doc('services/'+data.id).set(update, {merge: true});
    }

    const deleteService = async () => {
      if (window.confirm("Are you sure you want to delete this?")) {
        StateManager.setLoading(true);
        await firebase.firestore().doc("services/"+data.id).delete();
        history.push("/service-pipeline")
        StateManager.setLoading(false);
      }
    }

    const sections = {
        'date': () => <DateLine id={'date'} label={'Creation Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        'service': () => <TextLine id={'name'} label='Service' data={data} updater={updater} placeholder="Service Name" drop_is />,
        'order': () => <TextLine id={'id'} label='Order' data={order} updater={orderUpdater} placeholder="SO Number" disabled={!StateManager.isBackoffice()} drop_is />,
        "mechanic": () => <SelectLine id={'mechanic'} label={'Mechanic'} selections={constants.makeSelects("mechanicNames")} disabled={!StateManager.isBackoffice()} data={data} updater={mechUpdater} />,
        'priority': () => <TextLine id={'priority'} label='Priority' data={data} updater={updater} placeholder="Priority" type="number" drop_is />,
        "status": () => <SelectLine id={'status'} label={'Status'} selections={constants.makeSelects("service_statuses")} data={data} updater={statusUpdater} />,
        'time': () => <TextLine id={'time'} label='Hours' data={data} updater={timeUpdater} placeholder="Service Hours" type="number" disabled={!StateManager.isBackoffice()} drop_is />,
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
            <FormControlLabel control={<Checkbox checked={true} />} label={'Service data'} />
            <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end",}}>
              {data.thumbnail && <img style={{ height: 120, width: 160 }} src={data.thumbnail} />}
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} href={orderURL}>
                <h3>{stockNumber || ""}</h3>
                <LaunchIcon />
              </a>
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} href={carURL}>
                <h4>{data.carTitle || ""}</h4>
                <LaunchIcon />
              </a>
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
          <div>
            {
              StateManager.isAdmin() && (
                <Button variant="contained" color="primary" onClick={deleteService}>
                  Delete Service
                </Button>
              )
            }
          </div>
        </div>
        );
}