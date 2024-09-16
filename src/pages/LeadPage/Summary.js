import React from 'react';
import 'react-tabs/style/react-tabs.css';
import firebase from '../../utilities/firebase.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextLine from '../../components/TextLine.js';
import DateLine from '../../components/DateLine.js';
import NewFileLine from '../../components/NewFileLine.js';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager.js';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import SelectLine from '../../components/SelectLine.js';
import Check from '../../components/Check.js';
import constants from '../../utilities/constants.js';
import LaunchIcon from '@mui/icons-material/Launch';
import { Button } from '@mui/material';
import history from '../../utilities/history.js';

export default function Summary(props) {
    const { data = {} } = props;

    const carURL = data.car && `/car/${data.car.stock}`;

    const dateUpdate = async (id, date) => {
        let update = {[id]: !date ? "" : moment(date).format('YYYY-MM-DD')}
        await firebase.firestore().doc('leads/'+data.id).set(update, {merge:true});
    }

    const updater = (id, value) => firebase.firestore().doc('leads/'+data.id).set({[id]: value}, {merge: true});

    const salesUpdater = (id, value) => {
      let update = {[id]: value || ""};
      let settings = constants.sales.filter(rep => rep.id === value).at(0) || {};
      update.salesRep = settings.name || "";
      firebase.firestore().doc('leads/'+data.id).set(update, {merge: true});
    }

    const statusUpdater = (id, value) => {
      let update = {
        [id]: value || "",
        [`${id}_time`]: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      firebase.firestore().doc('leads/'+data.id).set(update, {merge: true});
    }

    const deleteLead = async () => {
      if (window.confirm("Are you sure you want to delete this?")) {
        StateManager.setLoading(true);
        await firebase.firestore().doc("leads/"+data.id).delete();
        history.push("/leads")
        StateManager.setLoading(false);
      }
    }

    const sections = {
        'stock': () => <TextLine id={'stock'} label='Stock Number' data={data} updater={updater} placeholder="Stock Number" drop_is />,
        'date': () => <DateLine id={'date'} label={'Creation Date'} data={data} updater={dateUpdate} minDate drop_is/>,
        'name': () => <TextLine id={'name'} label='Lead Name' data={data} updater={updater} placeholder="Name" drop_is />,
        'phone-number': () => <TextLine id={'phone'} label='Phone' data={data} updater={updater} placeholder="Phone Number" drop_is />,
        'email': () => <TextLine id={'email'} label='Email' data={data} updater={updater} placeholder="Email" drop_is />,
        'comments': () => <TextLine id={'comments'} label='Comments' data={data} updater={updater} placeholder="Comments" disabled={!StateManager.isAdmin()} drop_is multiline />,
        'timeline': () => <DateLine id={'timeline'} label={'Purchase Timeline'} data={data} updater={dateUpdate} minDate drop_is/>,
        "status": () => <SelectLine id={'status'} label={'Lead Status'} selections={constants.makeSelects("lead_statuses")} data={data} updater={statusUpdater} />,
        "salesrep": () => <SelectLine id={'sales_id'} label={'Sales Rep'} selections={constants.makeSelects("sales", {valueKey: "id", labelKey: "name"})} disabled={!StateManager.isBackoffice()} data={data} updater={salesUpdater} />,
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
            <a style={{display: 'flex', flexDirection: "row", alignItems: "center", textDecoration: "none", color: "black"}} href={carURL}>
            <div style={{display: 'flex', flexDirection: "column", alignItems: "flex-end",}}>
              {data.thumbnail && <img style={{ height: 120, width: 160 }} src={data.thumbnail} />}
              <div style={{display: 'flex', flexDirection: "row", alignItems: "center",}}>
                <h4>{data.carTitle || ""}</h4>
                <LaunchIcon />
              </div>
            </div>
            </a>
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
                <Button variant="contained" color="primary" onClick={deleteLead}>
                  Delete Lead
                </Button>
              )
            }
          </div>
        </div>
        );
}