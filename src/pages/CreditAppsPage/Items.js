import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select } from '@mui/material';
import moment from 'moment';


const headers = {
  services: [ 
    {key:'name', label:'Car'}, 
    {key:'contact', label:'Contact Methods'}, 
    {key:'time', label:'Time Submitted'}, 
    {key:'license', label:'License', noLink: true}, 
  ]
};


export default function Leads(props) {
  const { items = [], type = "services", disabled = false, showSummary } = props;

  const rows = items.map(item => {
    return {
      name: <>
        <b>{item.first_name+" " || ""}{item.last_name || ""}</b><br/>
        {item.buyer_address || "No addtess"}<br/>
      </>,
      contact: <>
        {item.phone_number || "No phone"}<br/>
        {item.email || "No email"}<br/>
      </>,
      license: <>
        <a href={item.license_front} target="_blank">License Front</a><br/>
        <a href={item.license_back} target="_blank">License Back</a><br/>
      </>,
      rowLink: item.location,
      time: item.time
    }
  })
  .sort(function(a,b){
    const dateFormat = "YYYY-MM-DD hh:mm:ss";
    return moment(b.time, dateFormat).valueOf() - moment(a.time, dateFormat).valueOf();
    });


  const summary = [
    {label: 'Total', value: items.length},
  ];

  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type],
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self" sorted/>
      </Grid>
    </Grid>
  );
}


const cleanSortDate = (date) => {
  if(date.split("-").length >= 4) return date;
  else{
    return date += "-0-0-0";
  }
}