import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import algolia from '../../utilities/algolia';
import { StateManager } from '../../utilities/stateManager.js';
import ResultsList from '../../components/ResultsList';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { Add, Link, Search } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

export default function Customers(props) {
  const { stockNumber, customer = {}, table="deals", type } = props;
  const [value, setValue] = React.useState(customer.display_name || "");
  const [currentValue, setCurrentValue] = React.useState(value);
  const [check, setChecked] = React.useState(!!customer.display_name);
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState(0);

  React.useLayoutEffect(() => {
    setChecked(currentValue !== "");
  }, [currentValue]);

  const toggleCheck = e => {
    const isGoingToCheck = e.target.checked;
    setChecked(isGoingToCheck);
    if(!isGoingToCheck){
      setValue("");
      setCurrentValue("");
      setResults([]);
      removeCustomerFromObjects(stockNumber, type);
      return;
    }
  }

  const updateValue = async (e) => {
    const { value } = e.target;
    setValue(value);

    if(value == ""){
      setCurrentValue("");
      setResults([]);
      removeCustomerFromObjects(stockNumber, type);
      return;
    }

    const index = algolia.client.initIndex('customers');
    const { hits } = await index.search(value);
    const results = hits.map(hit => ({
      ...hit, 
      action: getAction(hit),
      label: getLabel(hit)
    }))

    const addEntry = {
      action: () => makeCustomer(value),
      label: "Make New Customer"
    }

    setResults([addEntry, ...results]);
    // console.log(results)
  }

  const onBlur = (e) => {
    console.log(e)
    setTimeout(function() {
      if(check) setValue(currentValue);
      setResults([]);
    }, 200);
  }

  const getAction = (hit) => {
    const action = async (data) => {
      const display_name = `${hit.first_name || ""}${!!hit.last_name ? " " : "" }${hit.last_name || ""}`;
      setValue(display_name);
      setCurrentValue(display_name);
      setResults([]);
      return await setCustomer(stockNumber, type, hit.objectID);
    }
    return action
  }

  const keyPress = (e) => {
    if(e.key === "Enter") {
      const curr_hit = results[selected];
      return curr_hit.action()
    }

    if(e.key === "Escape") {
      setValue(currentValue);
      setResults([]);
      return;
    }

    let newActive = selected;
    if(e.key === "ArrowUp") newActive -=  1;
    if(e.key === "ArrowDown") newActive += 1;
    newActive = Math.max( Math.min(results.length, newActive), 0)
    setSelected(newActive);
  }

  const makeCustomer = (newValue) => {
    const customer = uuidv4();
    const [first_name="", last_name=""] = newValue.split(" ");
    const url = new URL(window.location.href)
    const redirect = url.pathname
    const destination = `/form/new-customer?redirect=${redirect}&stock=${stockNumber}&type=${type}&customer=${customer}&table=${table}&first_name=${first_name}&last_name=${last_name}`
    history.push(destination);
  }

  const custLink = "/customer/"+customer.customer;

  const editCustomer = () => {
    history.push(custLink);
  }

  const deleteCustomer = async (e) => {
    if (window.confirm("Are you sure you want to remove this customer?")) {
      toggleCheck(e)
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white', 
        padding: '17px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottomWidth: '3px' 
      }}>
        <FormControlLabel control={<Checkbox checked={check} onClick={deleteCustomer} />} label={formatTitle(props.type)} />
        <div>
          <TextField
              id={props.type}
              label="Customer Name"
              value={value}
              onChange={updateValue}
              onKeyDown={keyPress}
              onBlur={onBlur}
          />
          <div style={{position: "absolute", zIndex: 10000}}>
            <ResultsList results={results} selected={selected} removeIcon forceHeight capWidth/>
          </div>
          {
            !currentValue || 
              <EditIcon onClick={editCustomer} aria-label="add-link" color="secondary">
                <Link />
              </EditIcon>
          }
        </div>
      </div>
    </>
  );
}


const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const getLabel = (hit) => {
  const highlights = hit._highlightResult
  const name = (highlights.first_name?.value || "") + " " + (highlights.last_name?.value || "")
  // const address = (highlights.address1?.value || "") + " " + (highlights.state?.value || "") + " " + (highlights.zip?.value || "")
  return `${name}`;
}

const removeCustomerFromObjects = async (stockNumber, type) => {
  console.log("blurb", stockNumber, type);
  const removal = {[type]: firebase.firestore.FieldValue.delete()};
  await firebase.firestore().doc('orders/'+stockNumber).set(removal, {merge: true});
}

const setCustomer = async (stockNumber, type, id) => {
  const addition = {[type]: id}
  const db = firebase.firestore();
  await db.doc('orders/'+stockNumber).set(addition, {merge: true});
  let customer = await db.doc(`customers/${id}`).get();
  customer = customer.data();
  customer.display_name = `${customer.first_name || ""}${!!customer.last_name ? " " : ""}${customer.last_name || ""}`;
  const update = {[type]: customer};
  StateManager.updateCar(update);
}
