import React from 'react';
import 'react-tabs/style/react-tabs.css';
import firebase from '../../utilities/firebase';

import Check from '../../components/Check.js';
import DateLine from '../../components/DateLine.js';
import FileLine from '../../components/FileLine.js';

export default function DMV(props) {
    const { car = {} } = props;
    const stockNumber = car.stock

    const updater = (id, value) => {
      let deal_update = {}

      if(id === "title-received" && !value) deal_update.title_status = "pending";
      else if(id === "title-received" && value) deal_update.title_status = "processing";
      else if(id === "title-sent") deal_update.title_status = "complete";
      else if(id === "complete") deal_update.title_status = "complete";

      firebase.firestore().doc('deals/'+stockNumber).set(deal_update, {merge: true})
      firebase.firestore().doc('cars/'+stockNumber).set({[id]: value}, {merge: true})
    };

    const sections = {
        'title-received': () => <DateLine id={'title_received'} label={'Title Recieved'} data={car} updater={updater} />,
        'title-front': () => <FileLine id={'title_front'} label={'Title Front'} data={car} single={true} />,
        'title-back': () => <FileLine id={'title_back'} label={'Title Back'} data={car} single={true} />,
        'title-in-name': () => <Check id={'title_in_name'} label={'Title Put in Skyway Name'} data={car} updater={updater} />,
        'memorabilia': () => <Check id={'has_memorabilia'} label={'Has Memorabilia'} data={car} updater={updater} />,
        'title-taken': () => <DateLine id={'title_taken'} label={'Taken to State'} data={car} updater={updater} />,
        'title-sent': () => <DateLine id={'title_sent'} label={'Sent to Customer'} data={car} updater={updater} />,
        'complete': () => <Check id={'title_complete'} label={'All Tasks Complete'} data={car} updater={updater} />,
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