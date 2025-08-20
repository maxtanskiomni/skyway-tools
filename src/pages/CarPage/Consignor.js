import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Customers from './Customers.js';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager.js'
import RequestManager from '../../utilities/requestManager.js';

import NewFileLine from '../../components/NewFileLine.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import FileLine from '../../components/FileLine.js';
import SelectLine from '../../components/SelectLine.js';
import Button from '@mui/material/Button';
import constants from '../../utilities/constants.js';

export default function Consignor(props) {
    let { car } = props;
    const stockNumber = car.stock;
    const signer = car.consignor || {};
    const [printDisabled, setPrint] = React.useState(false);
    StateManager.setPrint = setPrint;

    const updater = (id, value) => {
      firebase.firestore().doc('cars/'+stockNumber).set({[id]: value}, {merge: true});
      car[id] = value;
    }

    const ntoUpdater = async (id, value) => {
        updater(id, value)
        if(id == "is_nto") return

        const snap = await firebase.firestore().doc(`purchases/${stockNumber}-NTO`).get();
        const nto = snap.exists ? snap.data() : {};
        const doc = {
            date: !!nto.date ? nto.date : moment().format('MM/DD/YYYY'),
            account: 'repair',
            memo: "NTO",
            stock: stockNumber,
            amount: value,
            vendor: signer.display_name || "",
            isPayable: snap.exists ? nto.isPayable == undefined || !!nto.isPayable : true,
        }
        firebase.firestore().doc(`purchases/${stockNumber}-NTO`).set(doc, {merge: true});
    }

    const getPDF = async () => {
        if(!validateForm(car)) return;
        const params = {
          function: "preparePDF",
          variables: {
            stockNumber,
            doctype: "consign"
          }
        };
        return await RequestManager.get(params);
    }

    const viewPDF = async ({type = "jacket"}) => {
        StateManager.setLoading(true);
        const pdfDoc = await getPDF();


        if(pdfDoc.success == false){
          StateManager.setLoading(false);
          StateManager.setAlertAndOpen('Hmm... there was an error.', "error");
          return;
        }

        let pdfLink = document.createElement('a');
        pdfLink.href = pdfDoc.file;
        pdfLink.target = "_blank";
        pdfLink.click();
        StateManager.setLoading(false);
    };

    const startSigning = async () => {
      StateManager.setLoading(true);
      const pdfDoc = await getPDF();
      const signerKeys = [ 'email', 'display_name', 'first_name', 'last_name' ];
      let cleanSigners = [
          // {email: "ryan@skywayclassics.com", display_name: "Ryan Tanski", first_name: "Ryan", last_name: "Tanski"},
          signer
      ];
      cleanSigners = cleanSigners.map(signer => {
          Object.keys(signer).forEach((key) => signerKeys.includes(key) || delete signer[key])
          return signer;
      }).filter(x => Object.keys(x).length > 0);

      const parameters = {
          function: "getSignatures",
          variables:{
            file_from_url: pdfDoc.file,
            signers: cleanSigners,
            name: `${car.year || ""} ${car.make || ""} ${car.model || ""}  Consignment Packet`,
            subject: `${car.year || ""} ${car.make || ""} ${car.model || ""} Consignment Packet`,
            message: "Thank you for choosing Skyway Classics to sell your classic car. Please review and sign the follwoing consignment agreement so we can get your car listed as soon as possible!\n\nIf you encounter any issues, please call your consignment representative for assistance.\n\nAgain, thank you for choosing Skyway Classics. We are looking forward to conducting business with you!",
            events_callback_url: process.env.NODE_ENV === 'development'
              ? `https://8b1b51767223.ngrok.io/skyway-dev-373d5/us-central1/processSignRequestEvent?type=consignment&table=cars&ref=stock&id=${stockNumber}`
              : `https://us-central1-skyway-dev-373d5.cloudfunctions.net/processSignRequestEvent?type=consignment&table=cars&ref=stock&id=${stockNumber}`,
          }
      };
      console.log(parameters);

      let response = await RequestManager.post(parameters);

      if(response.status == 'complete'){
        StateManager.setAlertMessage('Packet Sent!');
      }
      else{
          StateManager.setAlertSeverity("error");
          StateManager.setAlertMessage('Hmm... there was an error.')
      }
      StateManager.setLoading(false);
      StateManager.openAlert(true);
    };

    const printChecks = async () => {
      await writeCheck(car);
    };

    let keysToRemove = StateManager.isManager() || car.status !== "sold" ? [] : [
      "nto",
    ];

    if(!StateManager.isManager()) keysToRemove = [...keysToRemove, "updated_nto"];

    const sections = {
        'consignor': () => <Customers customer={car.consignor} stockNumber={stockNumber} type='consignor' table={'cars'} />,
        'license': () => <NewFileLine id={"license"} label={"Consignor License"} allowable="imageLike" folder="customer_data" saveLocation={`customers/${car.consignor.id}`} data={car.consignor} updater={StateManager.updateCar} />,
        'start-date': () => <DateLine id={'contract_start'} label={'Contract Start'} data={car} updater={updater} />,
        'end_date': () => <DateLine id={'contract_end'} label={'Contract End'} data={car} updater={updater} />,
        'actual_miles': () => <Check id={'is_actual'} label={'Is Actual Miles'} data={car} updater={updater} />,
        'nto': () => <TextLine id={'nto'} label={'Original NTO'} type="number" data={car} updater={ntoUpdater} />,
        'updated_nto': () => <TextLine id={'updated_nto'} label={'Updated NTO'} type="number" data={car} updater={updater} />,
        'consign-rep': () => <SelectLine id={'consign_rep'} label='Consignment Rep' data={car} updater={updater} selections={constants.consignors.map(name => ({value: name, label: name}))} />,
        'title-front': () => <NewFileLine id={"title_front"} label={"Title Front"} allowable="imageLike" folder="titles" saveLocation={`cars/${stockNumber}`} data={car} updater={StateManager.updateCar} />,
        'title-back': () => <NewFileLine id={"title_back"} label={"Title Back"} allowable="imageLike" folder="titles" saveLocation={`cars/${stockNumber}`} data={car} updater={StateManager.updateCar} />,
        'memorabilia': () => <Check id={'has_memorabilia'} label={'Has Memorabilia'} data={car} updater={updater} />,
        'contract': () => <Action 
                                label={'Contract'} 
                                primary={{
                                    label:'View',
                                    action: viewPDF,
                                }} 
                                secondary={{
                                    label:'Send for Signature',
                                    action: startSigning,
                                }} 
                            />,
        'signed-packet': () => <NewFileLine id={"consignment_doc"} label={"Signature Status"} allowable="imageLike" folder="consignments" saveLocation={`cars/${car.id}`} data={car} removeDelete />,
    }.filterKeys(keysToRemove);

    return (
        <>
          {
              Object.keys(sections).map((section, i) => 
                <div style={{marginBottom: '3px'}}>
                    {sections[section]()}
                </div>
              )
          }
          {
          StateManager.isUserAllowed("checks") && (
            <div style={{width: "100%", justifyContent: "center"}}>
              <Button disabled={printDisabled} variant="contained" color="primary" style={{marginTop: '20px'}} onClick={printChecks}>
                Print NTO Check
              </Button>
            </div>
          )
          }
        </>
        );
}

function validateForm(data){
    let message = false;
    if(!data.consignor) message = "Missing Consignor Data";
    else if(!data.consignor?.email) message = "Missing consginor email";
    else if(!data.consignor?.license) message = "Missing consginor driver license";
    else if(!data.nto) message = "Missing NTO";
    else if(!data.contract_end) message = "Missing Contract End";
    else if(!data.contract_start) message = "Missing Contract Start";
    else if(!data.year) message = "Missing Car Year";
    else if(!data.make) message = "Missing Car Make";
    else if(!data.model) message = "Missing Car Model";
    else if(!data.vin) message = "Missing VIN";
    else if(!data.miles) message = "Missing Miles";
    else if(!data.color) message = "Missing Color";
    if(!message) return "success";

    StateManager.setLoading(false);
    StateManager.setAlertAndOpen(message, "error")
}

const writeCheck = async (car) => {
  StateManager.setAlertAndOpen("Making check..", "info");
  StateManager.setLoading(true);
  const purchase_id = `${car.stock}-NTO`;
  let nto = await firebase.firestore().doc(`purchases/${purchase_id}`).get();
  const amount = car.updated_nto || nto.data().amount;
  console.log(amount)
  const payee = car.consignor.display_name;
  // const date = payee === "Ron's Classic Cars" ? moment().add(7, "weeks").format("MM/DD/YYYY") : moment().format("MM/DD/YYYY");
  const date = moment().format("MM/DD/YYYY");
  const memo = `INV| ${car.stock} ${car.year} ${car.model} VIN: ${car.vin}`;
  const checkRequests = [{amount, recipient: payee, memo, date, purchase_id}];
  const writeParams = {function: "writeChecks", variables: {checkRequests, keepPayable: payee === "Ron's Classic Cars"}};
  const writeResponse = await RequestManager.post(writeParams);

  if(writeResponse.success) StateManager.setAlertAndOpen("Check created!", "success");
  else StateManager.setAlertAndOpen("Check not created", "error");

  StateManager.setLoading(false);
}