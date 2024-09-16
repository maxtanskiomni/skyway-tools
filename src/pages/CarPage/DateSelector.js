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
import { StateManager } from '../../utilities/stateManager.js';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import moment from 'moment';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function DateSelector(props) {
  const { stockNumber, date} = props;
  const [selectedDate, setDate] = React.useState(!!date ? new Date(date) : '');
  const [check, setChecked] = React.useState(false);

  const recordDate = async(date) => {
    console.log(date)
    let newdate = !date ? "" : moment(date).format('MM-DD-YYYY');
    let month = !date ? "" : moment(newdate).format('YYYY-MM');
    await firebase.firestore().doc('deals/'+stockNumber).set({date: newdate, month}, {merge:true});
    setDate(date);
  }

  // React.useEffect(() => {
  //   setDate(moment(date || '').format('yyyy-MM-DD'));
  // }, [date]);

  React.useLayoutEffect(() => {
    const shouldCheck = selectedDate !== "" &&  selectedDate !== "Invalid date";
    setChecked(shouldCheck)
  }, [selectedDate]);

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<Checkbox checked={check} onClick={e => e.stopPropagation()} />} label={'Sale Date'} />
      <div>
        <DatePicker 
          style={{alignText: 'right'}} 
          onChange={recordDate} 
          selected={selectedDate}
          customInput={<TextField label={"Sale Date"}/>}
        />
      </div>
    </div>
  );
}
