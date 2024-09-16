import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';
import Dropdown from './Dropdown.js';
import TextLine from './TextLine.js';
import SelectLine from './SelectLine.js';
import DateLine from './DateLine.js';
import { Typography } from '@mui/material';
import moment from 'moment';
import firebase from '../utilities/firebase.js';
import { StateManager } from '../utilities/stateManager.js';


export default function POCard(props) {
  let {name, status, shopmonkeyId, vehicle, stock, description} = props;
  status = getStatus(props);
  const [curPart, setPart] = React.useState(props);
  const [curStatus, setStatus] = React.useState(status);

  const updater = async (id, data) => {
    const update = {[id]: data, status: curStatus};
    const newPart = {...curPart, ...update};
    setPart(newPart)
    setStatus(getStatus(newPart));
    await firebase.firestore().doc(`parts/${shopmonkeyId}`).set(update, {merge: true});
  };

  const fields = [
    {id: "description", type: "div", props: {label: "Notes", multiline: true, disable: true}},
    {id: "vendor", type: "text", props: {label: "Vendor", updater}},
    {id: "part-link", type: "text", props: {label: "Part Link", updater}},
    {id: "date-ordered", type: "date", props: {label: "Date Ordered", updater}},
    {id: "tracking-number", type: "text", props: {label: "Tracking Number", updater}},
    {id: "date-arrived", type: "date", props: {label: "Date Arrived", updater}},
    {id: "location", type: "select", props: {label: "Part Location", updater, selections: locations}}, 
  ];

  const label = (
    <>
      <div style={{color: "black", fontSize:18, fontWeight: "bold"}}>
        {StateManager.formatTitle(name)} {props.quantity > 0 && ` - ${props.quantity}x`}
      </div>
      <div style={{color: "black", fontSize:13, paddingTop: 5}}>
        {vehicle} {stock}
      </div>
    </>

  );

  const statusTag = (
    <div style={{borderRadius: 3, color: "white", backgroundColor: labelColors[curStatus], fontSize:14, fontWeight: "bold", padding:4}}>
      {StateManager.formatTitle(curStatus)}
    </div>
  )

  return (
    <Dropdown id={name} label={label} expand={false} value={statusTag} disabledURLUpdate>
      {
        fields.map(field => components[field.type]({...field.props, id: field.id, data: props}))
      }
    </Dropdown>
  );
}

const components = {
  "text": (props) => <TextLine removeBox drop_is {...props} />,
  "date": (props) => <DateLine removeBox drop_is {...props} />,
  "select": (props) => <SelectLine removeBox {...props} />,
  "div": (props) => <div style={{color: "black", fontSize:13, paddingTop: 5, textAlign: "left"}}>{props.data[props.id]}</div>,
  // 'file': (props) => <FileLine id={props.id} label={props.label} data={props.data} single={true} />,
}

const locations = [
  {label: "Back Office", value: "back"},
  {label: "Sales Office", value: "sales"},
  {label: "Mechanic Storage", value: "storage"},
  {label: "In Vehicle", value: "vehicle"},
].sort((a,b) => b.label - a.label)

const labelColors = {
  pending: "gray",
  ordered: "blue",
  arrived: "green",
}

const getStatus = (part) => {
  let status = "pending";
  if(!!part["date-arrived"]) status = "arrived";
  else if(!!part["date-ordered"]) status = "ordered";
  return status
}
