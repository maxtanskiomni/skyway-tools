import React from 'react';
import Grid from '@mui/material/Grid';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';
import Timesheet from './Timesheet.js';

import { StateManager } from "../../utilities/stateManager.js";
import SelectLine from '../../components/SelectLine.js';
import constants from '../../utilities/constants.js';
import IconButton from '@mui/material/IconButton';
import DateLine from '../../components/DateLine';
import { Delete } from '@mui/icons-material';


export default function TimesheetsPage(props) {
  const  { date } = props.match.params;
  const url = new URL(window.location.href);
  const defaultEmployee = url.searchParams.get("employee");
  const [employee, setEmployee] = React.useState(defaultEmployee || "");
  const [timesheet, setTimesheet] = React.useState({hours:[]});
  StateManager.setTitle("Timesheets");

  React.useEffect(() => {
    async function fetchData() {
      if(!employee || !date) return;
      const id = `${date}-${employee.toLowerCase().replace(/ /g,"")}`;
      StateManager.setLoading(true);
      const db = firebase.firestore();
      let timesheet = await db.doc(`timesheets/${id}`).get();
      timesheet = {id, hours:[], ...timesheet.data()};
      setTimesheet(timesheet);

      StateManager.setLoading(false);
    }
    fetchData();
  }, [employee, date]);

  const updateEmployee = (key, value) => {
    setEmployee(value);
    let params = url.pathname;
    if(url.search === '') params += "?employee="+value;
    else if(url.search.indexOf('employee=') < 0) params += url.search + "&employee="+value;
    else params += url.search.replace(/employee=.*[^&]/g, "employee="+value);
    console.log(params);
    history.replace(params);
  }

  const changeDate = (date) => {
    StateManager.setLoading(true);
    const new_date = moment(date).format("YYYY-MM-DD");
    history.push("/timesheets/"+new_date+url.search);
  }

  const updateTimesheet = (timesheet) => {
    setTimesheet(timesheet);
    updateDirectCosts(timesheet.hours, date, employee);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <DateLine 
          label="Date" 
          startDate={moment(date).format("MM/DD/YYYY")}
          callback={changeDate}
          dateFormat="MM/dd/yyyy"
        />
        <SelectLine 
          id={'employee'}
          label="Employee" 
          selections={constants.makeSelects("employees").slice(1)}
          updater={updateEmployee}
          data={{employee}}
        />
      </Grid>
      <Timesheet timesheet={timesheet} updater={updateTimesheet} date={date}   />
    </>
  );
}

async function updateDirectCosts(items, date, employee){
  let costs = {};

  const end = items.length > 0 ? time2Num(items[items.length-1].time) : 0;
  const start = items.length > 0 ? time2Num(items[0].time) : 0;
  let total_duration = Math.round(100*(end - start))/100 || 1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const {time, value = ""} = item;
    if(value.includes("INV")){
      const [code, stock] = value.split("|");
      if(!costs[stock]) costs[stock] = [];
      const next_i = i+1 > items.length-1 ? items.length-1 : i+1;
      const next_time = items[next_i].time;
      const duration =  Math.round(100*(time2Num(next_time) - time2Num(time)))/100;
      const duration_cost = employeeRateTimeConverter[employee](duration, total_duration);
      costs[stock].push(duration_cost);
    }
  }

  const costPromises = Object.keys(costs).map(async stock => {
    const id = `${date}-${employee.toLowerCase()}-${stock}-labor`;
    const amount = costs[stock].reduce((a,c) => a + c, 0);
    const expense = {
      amount,
      stock,
      date: moment().format("YYYY/MM/DD"),
      paidDate: moment().format("YYYY/MM/DD"),
      isPayable: false,
      memo: `${employee} Labor`,
      account: 'repair',
      isWages: true,
    }
    if(amount <= 0 ) return await firebase.firestore().doc(`purchases/${id}`).delete();
    return await firebase.firestore().doc(`purchases/${id}`).set(expense);
  }); 
  await Promise.all(costPromises);
}

const employeeRateTimeConverter = {
  Karl: (duration = 0, total=1, rate = 18) =>  Math.round(100 * rate * duration)/100,
  Rueben: (duration = 0, total=1, rate = 200) => Math.round(100 * rate * duration / total)/100,
  Chino: (duration = 0, total=1, rate = 200) => Math.round(100 * rate * duration / total)/100,
  Augy: (duration = 0, total=1, rate = 200) => Math.round(100 * rate * duration / total)/100,
}

function time2Num(time){
  if(!time) return 0;
  const [hour, min] = time.split(":");
  return Math.round(100*(+hour + min/60))/100;
}