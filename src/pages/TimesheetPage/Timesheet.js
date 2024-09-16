import React from 'react';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import { MenuItem } from '@mui/material';
import SimpleTable from '../../components/SimpleTable';
import TimePicker from 'react-time-picker';
import firebase from '../../utilities/firebase.js';
import constants from '../../utilities/constants.js';
import moment from 'moment';

const headers = [
    {key:'time', label:'Time'},
    {key:'task', label:'Task'},
  ];

export default function Timesheet(props) {
  let { timesheet = {hours:[]}, date } = props;
  const [codes, setCodes] = React.useState(constants.makeSelects("timeCodes"));

  React.useEffect(async () => {
    let cars = await firebase.firestore().collection('cars').get();
    cars = cars.docs.map(doc => {
      const car = doc.data();
      return {value: `INV|${car.stock}`, label: `${car.stock} ${car.year} ${car.model} ${car.make}`};
    }).sort((a, b) => (+b.value.split("|")[1].replace("-FL", "")) - (+a.value.split("|")[1].replace("-FL", "")));

    setCodes([...codes, ...cars]);
  }, [])

  const updateTimesheet = (index, data = {}) => {
    Object.keys(data).forEach(key => timesheet.hours[index] = {...timesheet.hours[index], [key]: data[key]});
    timesheet.hours = timesheet.hours.filter(entry => !!entry.time);
    if(timesheet.id) firebase.firestore().doc(`timesheets/${timesheet.id}`).set(timesheet, {merge:true});
    props.updater && props.updater({...timesheet});
  };

  let rows = [...Array(timesheet.hours.length+1).keys()].map(i => {
    let {time = null, value=""} = timesheet.hours[i] ? timesheet.hours[i] : {};

    return {
      time: <TimePicker onChange={(time) => updateTimesheet(i, {time})} value={time} disableClock disabled={i >= 1 && !timesheet.hours[i-1].value}  />, 
      task: <TimeRow id={i} defaultValue={value} codes={codes} updater={updateTimesheet} disabled={!time} />
    }
  });

  const end = timesheet.hours.length > 0 ? time2Num(timesheet.hours[timesheet.hours.length-1].time) : 0;
  const start = timesheet.hours.length > 0 ? time2Num(timesheet.hours[0].time) : 0;

  const summary = [
    {label: 'Total Hours', value: Math.round(100*(end - start))/100},
  ];

  const tableData = {
    rows,
    summary,
    headers,
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable forceAlignment="left" {...tableData}/>
      </Grid>
    </Grid>
  );
}


const TimeRow = (props) => {
  let { id, codes = [], defaultValue="WS|lunch break", disabled } = props;
  console.log(defaultValue)
  const [value, setValue] = React.useState(defaultValue);

  const onChange = (e) => {
    let { value = ""} = e.target;
    setValue(value);
    props.updater && props.updater(props.id, {value});
  }

  return(
    <Select
      style={{maxWidth:"100%", width:"75%" }}
      labelId={id}
      id={id}
      name={id}
      value={value || defaultValue}
      onChange={onChange}
      disabled={disabled}
    >
      {codes.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
}

function time2Num(time){
  if(!time) return 0;
  const [hour, min] = time.split(":");
  return Math.round(100*(+hour + min/60))/100;
}
