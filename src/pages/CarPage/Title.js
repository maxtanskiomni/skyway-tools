import React from 'react';
import firebase from '../../utilities/firebase';

import { StateManager } from '../../utilities/stateManager.js'

import Preview from '../../components/Preview.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import FileLine from '../../components/FileLine.js';
import SelectLine from '../../components/SelectLine.js';
import Dropdown from '../../components/Dropdown.js';
import RequestManager from '../../utilities/requestManager';

export default function Title(props) {
    const { car } = props;
    const { deal = {} } = car;
    const stockNumber = car.stock

    const carUpdater = (id, value) => firebase.firestore().doc('cars/'+stockNumber).set({[id]: value}, {merge: true});
    const titleUpdater = (id, value) => {
      if(value == null) value = firebase.firestore.FieldValue.delete();
      firebase.firestore().doc('titles/'+stockNumber).set({[id]: value}, {merge: true});
      let newCar = {...car};
      newCar.title = {...newCar.title, [id]: value};
      car.updater(newCar);
    };
    const buyerUpdater = (id, value) => firebase.firestore().doc('customers/'+car.buyer.id).set({[id]: value}, {merge: true});
    const cobuyerUpdater = (id, value) => firebase.firestore().doc('customers/'+car.cobuyer.id).set({[id]: value}, {merge: true});
    
    const getPDF = async (properties = {}) => {
      const {doctype = "title"} = properties;
        // if(!validateForm(deal)) return;
        const params = {
          function: "preparePDF",
          variables: {
            stockNumber,
            doctype,
          }
        };
        let preparePDF = await RequestManager.get(params);
        return preparePDF;
    }
    
    const viewPDF = async (params = {}) => {
        StateManager.setLoading(true);
        const pdfDoc = await getPDF(params);
        let pdfLink = document.createElement('a');
        pdfLink.href = pdfDoc.file;
        pdfLink.target = "_blank";
        pdfLink.click();
        StateManager.setLoading(false);
    };
    

    const sections = {
        buyer:{
            "first_name": () => <TextLine id={'first_name'} label={'First Name'} data={car.buyer} updater={buyerUpdater} />,
            "last_name": () => <TextLine id={'last_name'} label={'Last Name'} data={car.buyer} updater={buyerUpdater} />,
            "email": () => <TextLine id={'email'} label={'Email'} data={car.buyer} updater={buyerUpdater} />,
            "phone_number": () => <TextLine id={'phone_number'} label={'Phone Number'} data={car.buyer} updater={buyerUpdater} />,
            "address1": () => <TextLine id={'address1'} label={'Address'} data={car.buyer} updater={buyerUpdater} />,
            "city": () => <TextLine id={'city'} label={'City'} data={car.buyer} updater={buyerUpdater} />,
            "state": () => <SelectLine id={'state'} label={'State'} selections={"states"} data={car.buyer} updater={buyerUpdater} />,
            "zip": () => <TextLine id={'zip'} label={'Zip'} data={car.buyer} updater={buyerUpdater} />,
            "birthday": () => <TextLine id={'birthday'} label={'Birthday'} data={car.buyer} updater={buyerUpdater} />,
            "sex": () => <SelectLine id={'sex'} label={'Sex'} selections={"sexes"} data={car.buyer} updater={buyerUpdater} />,
            "dl": () => <TextLine id={'dl'} label={'Drivers License'} data={car.buyer} updater={buyerUpdater} />,
        },
        cobuyer:{
            "first_name": () => <TextLine id={'first_name'} label={'First Name'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "last_name": () => <TextLine id={'last_name'} label={'Last Name'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "email": () => <TextLine id={'email'} label={'Email'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "phone_number": () => <TextLine id={'phone_number'} label={'Phone Number'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "address1": () => <TextLine id={'address1'} label={'Address'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "city": () => <TextLine id={'city'} label={'City'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "state": () => <SelectLine id={'state'} label={'State'} selections={"states"} data={car.cobuyer} updater={cobuyerUpdater} />,
            "zip": () => <TextLine id={'zip'} label={'Zip'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "birthday": () => <TextLine id={'birthday'} label={'Birthday'} data={car.cobuyer} updater={cobuyerUpdater} />,
            "sex": () => <SelectLine id={'sex'} label={'Sex'} selections={"sexes"} data={car.cobuyer} updater={cobuyerUpdater} />,
            "dl": () => <TextLine id={'dl'} label={'Drivers License'} data={car.cobuyer} updater={cobuyerUpdater} />,
        },
        car:{
            'number': () => <TextLine id={'title_number'} label={'FL Title Number'} data={car} updater={carUpdater} />,
            'body': () => <TextLine id={'body_type'} label={'Body Type'} data={car} updater={carUpdater} />,
            'plate': () => <TextLine id={'license_plate'} label={'License Plate'} data={car} updater={carUpdater} />,
            'weight': () => <TextLine id={'weight'} label={'Weight'} data={car} updater={carUpdater} />,
            'prev_state': () => <SelectLine id={'prev_state'} label={'Previous Title State'} selections={"states"} data={car} updater={carUpdater} />,
            'fuel': () => <SelectLine id={'fuel_type'} label={'Fuel Type'} selections={StateManager.fuels} data={car} updater={carUpdater} />,
        },
        title:{
            'transfer': () => <SelectLine id={'app_type'} label={'Application Type'} selections={StateManager.app_types} data={car.title} updater={titleUpdater} />,
            'lien': () => <SelectLine id={'lien_holder'} label={'Lien Holder'} selections={"banks"} data={car.title} updater={titleUpdater} />,
            'fast-title': () => <Check id={'fast_title'} label={'Fast Title'} data={car.title} updater={titleUpdater} />,
        },
    };

    return (
        <div>
            {
                Object.keys(sections).map((section, i) => {

                    if(!deal[section] && section == "cobuyer") return;

                    const components = Object.keys(sections[section]).map((row, i) => 
                        <div style={{marginBottom: '3px'}}>
                            {sections[section][row]()}
                        </div>
                    )

                    return (
                        <Dropdown key={section} id={section} label={formatTitle(section)} component={components} />
                    )
                })
            }
            <Action 
                label={'Title Application'} 
                primary={{
                    label:'View App',
                    action: viewPDF,
                }} 
            />
            <Action 
                label={'Re-print to Skyway'} 
                primary={{
                    label:'Get Skyway App',
                    action: () => viewPDF({doctype: "title-skyway"}),
                }} 
            />
        </div>
        );
}

const formatTitle = raw => {
    raw = raw.split('-');
    raw = raw.join(' ');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function validateForm(data){
    let message = false;
    if(!data.date) message = "Missing Date";
    else if(!data.buyer) message = "Missing Buyer Data";
    else if(!data.invoice) message = "Missing Invoice Data";
    else if(!data.car) message = "Missing Car Data";
    else if(!data.carData.year) message = "Missing Car Year";
    else if(!data.carData.make) message = "Missing Car Make";
    else if(!data.carData.model) message = "Missing Car Model";
    else if(!data.carData.vin) message = "Missing VIN";
    else if(!data.carData.miles) message = "Missing Miles";
    else if(!data.carData.color) message = "Missing Color";
    if(!message) return "success";

    StateManager.setLoading(false);
    StateManager.setAlertAndOpen(message, "error")
}