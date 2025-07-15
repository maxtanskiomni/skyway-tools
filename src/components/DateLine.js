import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import TextField from '@mui/material/TextField';


export default function DateLine(props) {
  let {data = {}, id = ""} = props;
  if(!!props.startDate) data[id] = props.startDate;
  const stringDate = !!data[id] ? data[id].replace(/-/g, "/") : false;
  const initDate = stringDate ? Date.parse(stringDate) : "";
  const [date, setDate] = React.useState(initDate);
  const [startDate, setStartDate] = React.useState(initDate);
  const [endDate, setEndDate] = React.useState(Date.parse(props.endDate));
  const startCheck = initDate !== "";
  const [check, setChecked] = React.useState(startCheck);
  const datepickerRef = React.createRef();

  React.useLayoutEffect(() => {
      setChecked(date !== "")
  }, [date])

  const onChange = (date) => {
    console.log(date)

    if(props.selectsRange) {
      props.callback && props.callback(date);
      const [start, end] = date
      setStartDate(start)
      setEndDate(end)
      return
    }

    props.updater && props.updater(id, date && moment(date).format("YYYY/MM/DD"));
    if(!props.drop_is) props.updater && props.updater("is_"+id, !!date);
    props.callback && props.callback(date && moment(date).format("YYYY/MM/DD"));
    setDate(date);
  }
  
  const onCheck = () => {
    const newCheck = !check;
    const newDate = newCheck ? new Date() : "";
    if(!newCheck) datepickerRef.current.clear();

    setDate(newDate)
    props.updater && props.updater(id, newCheck ? moment(newDate).format("YYYY/MM/DD") : null);
    if(!props.drop_is) props.updater && props.updater("is_"+id, newCheck);
  }

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      {props.removeCheck || <FormControlLabel control={props.removeBox ? <></> : <Checkbox checked={check} onClick={onCheck} />} label={props.label || ""} />}
      <div>
        <DatePicker 
          ref={datepickerRef} 
          dateFormat={props.dateFormat}
          style={{alignText: 'right', maxWidth:"30%", width:"50%" }}
          onChange={onChange} 
          selected={date}     
          autoComplete="off"
          customInput={<TextField label={props.label || ""}/>}
          showMonthYearPicker={props.showMonthYearPicker}
          minDate={props.minDate && new Date()}
          selectsRange={props.selectsRange}
          startDate={props.selectsRange && startDate}
          endDate={props.selectsRange && endDate}
          disabled={props.disabled}
        />
      </div>
      <style>
        {`
          .react-datepicker-popper {
            z-index: 100 !important;
          }
        `}
      </style>
    </div>
  );
}
