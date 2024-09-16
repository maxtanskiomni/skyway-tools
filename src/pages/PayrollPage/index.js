import React from 'react';
import Grid from '@mui/material/Grid';
import Mechanics from './Mechanics.js';
import Salesreps from './Salesreps.js';
import Employees from './Employees.js';
import Service from './Service.js';
import DateLine from '../../components/DateLine';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import { StateManager } from "../../utilities/stateManager.js";


export default function PayrollPage(props) {
  const { date = moment().format("YYYY-DD-MM") } = props.match.params;
  const period =  moment(date).date() <= 15 ? 1 : 2;
  const query = moment(date).format(`YYYY-MM-${period}`)

  const [payload, setPayload] = React.useState({});
  StateManager.setTitle("Payroll Dashboard - "+query);
  const docRef = firebase.firestore().doc(`payrolls/${query}`);

  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      const payroll = await docRef.get();
      console.log("here", payroll.data())

      setPayload(payroll.data());

      StateManager.setLoading(false);
    }
    fetchData();
  }, [date]);

  const sections = {
    'mechanics': (i) => <Mechanics payload={i} docRef={docRef} date={moment(date)} />,
    'salesmen': (i) => <Salesreps payload={i} docRef={docRef} date={moment(date)} />,
    'service': (i) => <Service payload={i} docRef={docRef} date={moment(date)} />,
    'other': (i) => <Employees payload={i} docRef={docRef} date={moment(date)} />,
  };

  const changeDate = (date) => {
    StateManager.setLoading(true);
    const new_date = moment(date).format("YYYY-MM-DD")
    const url = new URL(window.location.href);
    history.push("/payroll/"+new_date+url.search);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <DateLine 
          label="Period" 
          startDate={moment(date).format("MM/DD/YYYY")}
          callback={changeDate}
          dateFormat="MM/dd/yyyy"
          // showMonthYearPicker
        />
      </Grid>
      <TabContainer payload={payload} sections={sections}/>
    </>
  );
}