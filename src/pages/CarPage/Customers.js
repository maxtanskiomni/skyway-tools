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
  
  // Ensure customer object has required properties
  const safeCustomer = customer && typeof customer === 'object' ? customer : {};
  const initialDisplayName = safeCustomer.display_name || "";
  
  const [value, setValue] = React.useState(initialDisplayName);
  const [currentValue, setCurrentValue] = React.useState(initialDisplayName);
  const [check, setChecked] = React.useState(!!initialDisplayName);
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync component state when customer prop changes
  React.useEffect(() => {
    const displayName = safeCustomer.display_name || "";
    setValue(displayName);
    setCurrentValue(displayName);
    setChecked(!!displayName);
  }, [safeCustomer.display_name, safeCustomer.id]);

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
      try {
        setIsLoading(true);
        const display_name = `${hit.first_name || ""}${!!hit.last_name ? " " : "" }${hit.last_name || ""}`;
        
        // First update the database
        await setCustomer(stockNumber, type, hit.objectID);
        
        // Only update UI state after successful database update
        setValue(display_name);
        setCurrentValue(display_name);
        setResults([]);
      } catch (error) {
        console.error('Error setting customer:', error);
        // Revert to previous state on error
        setValue(currentValue);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
    return action
  }

  const keyPress = (e) => {
    if(e.key === "Enter") {
      const curr_hit = results[selected];
      if (curr_hit && curr_hit.action) {
        return curr_hit.action()
      }
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
    const search = url.search
    const destination = `/form/new-customer${search}&redirect=${redirect}&stock=${stockNumber}&type=${type}&customer=${customer}&table=${table}&first_name=${first_name}&last_name=${last_name}`
    history.push(destination);
  }

  const custLink = "/customer/"+(safeCustomer.customer || safeCustomer.id);

  const editCustomer = () => {
    history.push(custLink);
  }

  const deleteCustomer = async (e) => {
    if (window.confirm("Are you sure you want to remove this customer from the deal?")) {
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
              disabled={props.disabled || isLoading}
              InputProps={{
                endAdornment: isLoading ? <CircularProgress size={20} /> : null,
              }}
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
  try {
    console.log("Removing customer from objects:", stockNumber, type);
    const removal = {[type]: firebase.firestore.FieldValue.delete()};
    
    // Update both deals and cars documents
    await Promise.all([
      firebase.firestore().doc('deals/'+stockNumber).set(removal, {merge: true}),
      firebase.firestore().doc('cars/'+stockNumber).set(removal, {merge: true})
    ]);
    
    // Also update the local state
    StateManager.updateCar(removal);
    
    console.log(`Successfully removed customer from ${type} on car ${stockNumber}`);
  } catch (error) {
    console.error('Error removing customer from objects:', error);
    throw error;
  }
}

const setCustomer = async (stockNumber, type, id) => {
  try {
    const addition = {[type]: id}
    const db = firebase.firestore();
    
    // Update both deals and cars documents
    await Promise.all([
      db.doc('deals/'+stockNumber).set(addition, {merge: true}),
      db.doc('cars/'+stockNumber).set(addition, {merge: true})
    ]);
    
    // Fetch the customer data
    let customerDoc = await db.doc(`customers/${id}`).get();
    
    if (!customerDoc.exists) {
      throw new Error(`Customer with ID ${id} not found`);
    }
    
    let customer = customerDoc.data();
    customer.id = id; // Add the id field to the customer object
    
    // Ensure display_name is properly formatted
    customer.display_name = `${customer.first_name || ""}${!!customer.last_name ? " " : ""}${customer.last_name || ""}`.trim();
    
    // Update the local state
    const update = {[type]: customer};
    StateManager.updateCar(update);
    
    console.log(`Successfully set customer ${id} for ${type} on car ${stockNumber}:`, customer);
    
    return customer;
  } catch (error) {
    console.error('Error in setCustomer:', error);
    throw error; // Re-throw to let the calling function handle it
  }
}
