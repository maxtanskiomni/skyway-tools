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
    const stockNumber = data.id;
    console.log(data)

    const serviceURL = stockNumber && `/service/${stockNumber}`;
    const orderURL = order.id && `/service-order/${order.id}`;
    const carURL = order.car && `/car/${order.car}`;
    const partURL = data.link;

    const updateSource = (target, id, value) => {
      let newOrder = {...data};
      newOrder[target] = {...newOrder[target], [id]: value};
      StateManager.updateCar(newOrder);
    }

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('YYYY/MM/DD')}
        console.log(update)
        await firebase.firestore().doc('parts/'+stockNumber).set(update, {merge:true});
        updateSource("deal", id, date);
    }

    const updater = (id, value) => firebase.firestore().doc('parts/'+data.id).set({[id]: value || ""}, {merge: true});

    const statusUpdater = (id, value) => {
      const update = {status: value, status_time: moment().format("YYYY/MM/DD")};
      firebase.firestore().doc('parts/'+data.id).set(update, {merge: true});
    }

    const sections = {
        // 'part': () => <TextLine id={'name'} label='Part' data={data} updater={updater} placeholder="Part" />,
        'vendor': () => <TextLine id={'vendor'} label='Vendor' data={data} updater={updater} placeholder="Vendor" />,
        'partNumber': () => <TextLine id={'partNumber'} label='Part Number' data={data} updater={updater} placeholder="Part Number" />,
        'link': () => <TextLine id={'link'} label='Part Link' data={data} updater={updater} placeholder="Part Link" />,
        "status": () => <SelectLine id={'status'} label={'Status'} selections={constants.makeSelects("part_statuses")} data={data} updater={statusUpdater} />,
        'returnComplete': () => <Check id={'returnComplete'} label={'Return Complete'} data={data} updater={updater} />,
        'order_date': () => <DateLine id={'orderDate'} label={'Order Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        'arrival_date': () => <DateLine id={'arrivalDate'} label={'Est Arrival Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        'return_date': () => <DateLine id={'returnDate'} label={'Date Returned'} data={data} updater={dateUpdate} minDate drop_is/>,
        "location": () => <SelectLine id={'location'} label={'Location'} selections={constants.makeSelects("part_locations")} data={data} updater={updater} />,
        // "mechanic": () => <SelectLine id={'mechanic'} label={'Mechanic'} selections={constants.makeSelects("mechanicNames")} disabled={StateManager.userType !== "admin"} data={data} updater={updater} />,
        'cost': () => <TextLine id={'cost'} label='Cost' data={data} updater={updater} placeholder="Cost" type="number" />,
    };

    const deleteSO = async () => {
      if (window.confirm("Are you sure you want to delete this?")) {
        StateManager.setLoading(true);
        await firebase.firestore().doc("parts/"+stockNumber).delete();
        history.push("/service-pipeline")
      }
    }

    if(data.status !== "returning") delete sections.returnComplete;

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
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} target="_blank" href={partURL}>
                <h3>{data.name || ""}</h3>
                <LaunchIcon />
              </a>
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} href={orderURL}>
                <h3>{order.id || ""}</h3>
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
                <Button variant="contained" color="primary" onClick={deleteSO}>
                  Delete Part
                </Button>
              )
            }
          </div>
        </div>
        );
}