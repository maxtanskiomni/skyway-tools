import React from 'react';
import Typography from '@mui/material/Typography';
import {useDropzone} from 'react-dropzone';
import firebase from '../utilities/firebase.js';
import CircularProgress from '@mui/material/CircularProgress';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Preview from './Preview.js';
import Store from '../utilities/store.js';
import IconButton from '@mui/material/IconButton';
import { Add, Link, Search } from '@mui/icons-material';
import { StateManager } from '../utilities/stateManager.js';

import { v4 as uuidv4 } from 'uuid';
import { TextField } from '@mui/material';
import RequestManager from '../utilities/requestManager.js';


export default function PaymentLine(props) {
  const { reference, customer = {}, label = "", title = "", type ="", thumbnail = "", test = false, enable = false, revenue, deposits } = props;
  let {items = []} = props;
  console.log(deposits, items)
  const devtype = process.env.NODE_ENV === "development" ? "test" : "prod";
  if(items.length <= 0){
    items = [{desc: "Invoice Amount", amount: revenue}, {desc: "Previous Deposits", amount: -deposits }];
  }

  const originalAmount = items.reduce((a,c) => a + (c.amount || 0), 0);
  const [amount, setAmount] = React.useState(originalAmount);
  StateManager.setPaymentLineAmount = setAmount;
  const [activeItems, setItems] = React.useState(items);

  const onChange = (e) => {
    const { value } = e.target;
    const newAmount = Number(value.replace(/,/g, "").replace("$", ""));
    // if(!newAmount) return;
    if(!isNaN(newAmount)) {
      setAmount(newAmount);
      if(newAmount === originalAmount) setItems(items); 
      else setItems([{desc: `${type.charAt(0).toUpperCase()}${type.substring(1)} Deposit`, amount: newAmount}]);
    }
  }

  const sendLink = async (shouldSend = false) => {
    if(amount < 1) StateManager.setAlertAndOpen("The amount is too low to run a credit card.", "error");
    else if(!customer.first_name || !customer.last_name) StateManager.setAlertAndOpen("The customer is missing information", "error");
    else if(!customer.email) StateManager.setAlertAndOpen("The customer needs an email to send a link.", "error");
    else if(!customer.phone_number) StateManager.setAlertAndOpen("The customer needs a phone number to send a link.", "error");
    else{
      StateManager.setLoading(true);
      let cust_id = {}
      if(!customer.stripe_id){
        let cust_vars = filterCustomer(customer, ["email"]);
        cust_vars.name = `${customer.first_name || ""} ${customer.last_name || ""}`;
        cust_vars.devtype = devtype;
        const stripe_cust = await RequestManager.post({function: "makeStripeCustomer", variables: {params: cust_vars}});
        console.log(stripe_cust)
        if(stripe_cust.success !== false) {
          await firebase.firestore().doc(`customers/${customer.id}`).update({stripe_id: stripe_cust.id});
          cust_id = {customer: stripe_cust.id}
        }
      }
      else{
        cust_id = {customer: customer.stripe_id}
      }

      let variables = {
        params: {
          amount: Math.floor(amount*100),
          ...cust_id,
          receipt_email: customer.email || null,
          metadata: {reference, type},
          description: `${reference} | ${title} | ${type}`,
          devtype,
        },
        options: {}
      }

      const intent = await RequestManager.post({function: "makePaymentIntent", variables});
      if(!intent.client_secret){
        StateManager.setLoading(false);
        StateManager.setAlertAndOpen("Error sending link.  Try again.", "error");
        return;
      }

      // console.log(items)
      const descriptions = activeItems.map(item => item.desc).join(",");
      // const charges = activeItems.map(item => item.amount || (amount/activeItems.length)).join(",");
      const charges = activeItems.map(item => item.amount).join(",");

      variables = {
        params: {
          // intent,
          name: customer.first_name || null,
          phone_number: customer.phone_number.replace(/\D+/g, ''),
          reason: props.reason || `Please use the following link to pay your ${type} balance`,
          link: encode(`${window.location.origin}/payment?intent=${intent.client_secret}&stock=${reference}&type=${type}&thumbnail=${thumbnail}&title=${title}&i=${descriptions}&c=${charges}`),
          devtype,
        },
        options: {}
      };
      console.log(variables.params);
      console.log(shouldSend)
      if(shouldSend){
        
        const sms = await RequestManager.post({function: "sendPaymentLink", variables});
        StateManager.setLoading(false);
        if(sms.success !== false) StateManager.setAlertAndOpen("Link sent!", "success");
        else StateManager.setAlertAndOpen("Error sending link.  Try again.", "error");
      }
      else{
        await navigator.clipboard.writeText(variables.params.link)
        
        StateManager.setLoading(false);
        StateManager.setAlertAndOpen("Link Copied!", "success");
      }
    }
  }

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '25px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={props.removeCheck ? <></> : <Checkbox checked={false} />} label={label} />
      <div style={{maxHeight: '40px', display:'flex', flexDirection:'row'}}>
        {
          props.removeAmount ? null :
          <TextField 
            inputProps={{style: { textAlign: props.alignment || 'center'}}}
            style={{maxWidth: props.maxWidth || "40%", width:"50%", marginRight: 30}}
            {...props}
            id={props.id}
            label={""}
            placeholder="Amount"
            type={props.type}
            value={"$"+amount.toLocaleString()}
            onChange={onChange}
            disabled={enable ? !enable : amount === 0}
          />
        }
        <Button
          variant="contained"
          color="primary"
          onClick={() => sendLink(false)}
        >
          Copy Link
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => sendLink(true)}
        >
          Text Link
        </Button>
      </div>
    </div>
  );
}


const filterCustomer = (cust, keysToKeep = []) => {
  let new_cust = Object.keys(cust).reduce((result, key) => {
    if (keysToKeep.includes(key) && !!cust[key]) {
      result[key] = cust[key];
    }
    return result;
  }, {});

  return new_cust;
}


const encode = (str) => {
  return str.replace(/ /g, "%20");
}
