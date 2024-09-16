import React from 'react';
import 'react-tabs/style/react-tabs.css';
import firebase from '../../utilities/firebase.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextLine from '../TextLine.js';
import DateLine from '../DateLine.js';
import { StateManager } from '../../utilities/stateManager.js'

import moment from 'moment';
import SelectLine from '../SelectLine.js';
import Check from '../Check.js';
import constants from '../../utilities/constants.js';
import LaunchIcon from '@mui/icons-material/Launch';
import history from '../../utilities/history.js';

export default function PartForm(props) {
    const { data = {} } = props;
    const {order = {}} = data;
    console.log(data, order)
    
    
    const stockNumber = data.id;

    const serviceURL = stockNumber && `/service/${stockNumber}`;
    const orderURL = order.stock && `/service-order/${order.stock}`;
    const carURL = order.car && `/car/${order.car}`;
    const partURL = data.link;

    const updateSource = (target, id, value) => {
      let newOrder = {...data};
      newOrder[target] = {...newOrder[target], [id]: value};
      StateManager.updateCar(newOrder);
    }

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('YYYY/MM/DD')}
        await firebase.firestore().doc('parts/'+stockNumber).set(update, {merge:true});
        updateSource("deal", id, date);
    }

    const updater = (id, value) => firebase.firestore().doc('parts/'+data.id).set({[id]: value || ""}, {merge: true});

    const statusUpdater = (id, value) => {
      const update = {status: value, status_time: moment().format("YYYY/MM/DD")};
      firebase.firestore().doc('parts/'+data.id).set(update, {merge: true});
    }

    const sections = {
        'part': () => <TextLine id={'name'} label='Part' data={data} updater={updater} placeholder="Part" />,
        'vendor': () => <TextLine id={'vendor'} label='Vendor' data={data} updater={updater} placeholder="Vendor" />,
        'partNumber': () => <TextLine id={'partNumber'} label='Part Number' data={data} updater={updater} placeholder="Part Number" />,
        'link': () => <TextLine id={'link'} label='Part Link' data={data} updater={updater} placeholder="Part Link" />,
        'order_date': () => <DateLine id={'orderDate'} label={'Order Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        'arrival_date': () => <DateLine id={'arrivalDate'} label={'Est Arrival Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        "status": () => <SelectLine id={'status'} label={'Status'} selections={constants.makeSelects("part_statuses")} data={data} updater={statusUpdater} />,
        "location": () => <SelectLine id={'location'} label={'Location'} selections={constants.makeSelects("part_locations")} data={data} updater={updater} />,
        'returnComplete': () => <Check id={'returnComplete'} label={'Return Complete'} data={data} updater={updater} />,
    };

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
            <FormControlLabel control={<Checkbox checked={true} />} label={'Service Order'} />
            <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end",}}>
              {order.thumbnail && <img style={{ height: 120, width: 160 }} src={order.thumbnail} />}
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} target="_blank" href={partURL}>
                <h3>{data.name || ""}</h3>
                <LaunchIcon />
              </a>
              <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} href={orderURL}>
                <h3>{order.stock || ""}</h3>
                <LaunchIcon />
              </a>
              <h4>{data.carTitle || ""}</h4>
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
