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

export default function Cars(props) {
  const { stockNumber, car = {}, table="deals", type } = props;
  const [value, setValue] = React.useState(car.title || "");
  const [currentValue, setCurrentValue] = React.useState(value);
  const [check, setChecked] = React.useState(!!car.title);
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

    const index = algolia.client.initIndex('cars');
    const { hits } = await index.search(value);
    const results = hits.map(hit => ({
      ...hit, 
      action: getAction(hit),
      label: getLabel(hit)
    }))

    const addEntry = {
      action: () => makeCar(value),
      label: "Make New Car"
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
      const display_name = `${hit.stock || ""}${!!hit.stock ? " " : "" }${hit.year || ""}${!!hit.year ? " " : "" }${hit.model || ""}`;
      setValue(display_name);
      setCurrentValue(display_name);
      setResults([]);
      return await setCar(stockNumber, type, hit.objectID);
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

  const makeCar = async (newValue) => {
    const counters = await firebase.firestore().doc('admin/counters').get();
    const new_stock = counters.data().lastServiceStock + 1;

    const url = new URL(window.location.href);
    const redirect = url.pathname;

    const [year="", make="", model=""] = newValue.split(" ");
    const carData = `year=${year}&make=${make}&model=${model}`;

    history.push(`/form/add-car?stock=${new_stock}&redirect=${redirect}&status=service&sub_status=complete&post=SR&${carData}&table=${table}&service_number=${stockNumber}`);
  }

  const editCar = () => {
    const link = "/car/"+car.id;
    history.push(link);
  }

  const deleteCustomer = async (e) => {
    if (window.confirm("Are you sure you want to remove this car?")) {
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
              label="Car"
              value={value}
              onChange={updateValue}
              onKeyDown={keyPress}
              onBlur={onBlur}
              style={{minWidth:250}}
          />
          <div style={{position: "absolute", zIndex: 10000}}>
            <ResultsList results={results} selected={selected} removeIcon forceHeight capWidth/>
          </div>
          {
            !currentValue || 
              <EditIcon onClick={editCar} aria-label="add-link" color="secondary">
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
  const name = (highlights.stock?.value || "") + " " +(highlights.year?.value || "") + " " + (highlights.model?.value || "")
  // const address = (highlights.address1?.value || "") + " " + (highlights.state?.value || "") + " " + (highlights.zip?.value || "")
  return `${name}`;
}

const removeCustomerFromObjects = async (stockNumber, type) => {
  console.log("blurb", stockNumber, type);
  const removal = {[type]: firebase.firestore.FieldValue.delete(), thumbnail: firebase.firestore.FieldValue.delete()};
  await firebase.firestore().doc('orders/'+stockNumber).set(removal, {merge: true});
}

const setCar = async (stockNumber, type, id) => {
  const db = firebase.firestore();
  let car = await db.doc(`cars/${id}`).get();
  car = car.data();
  car.title = `${car.year || ""} ${car.make || ""} ${car.model || ""}`;
  const update = {[type]: car, thumbnail: car.thumbnail || null};
  StateManager.updateCar(update);

  const addition = {[type]: id, thumbnail: car.thumbnail || null};
  await db.doc('orders/'+stockNumber).set(addition, {merge: true});
}
