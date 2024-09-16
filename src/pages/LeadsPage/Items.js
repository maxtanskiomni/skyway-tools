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

import Badge from '@mui/material/Badge';
import NewReleasesIcon from '@mui/icons-material/NewReleases';


const headers = {
  base: [ 
    {key:'thumbnail', label:'Car'}, 
    {key:'lead', label:'Lead'}, 
    {key:'contact', label:'Contact Methods'}, 
    {key:'salesRep', label:'Sales Rep'}, 
  ],
  indicator: [ 
    {key:'indicator', label:'New'},
    {key:'thumbnail', label:'Car'}, 
    {key:'lead', label:'Lead'}, 
    {key:'contact', label:'Contact Methods'}, 
    {key:'salesRep', label:'Sales Rep'}, 
  ]
};


export default function Leads(props) {
  const { items = [], type = "base", showSummary } = props;
  const [leads, setLeads] = React.useState(items)

  const rows = leads.map(lead => {
    const {car = {}} = lead;
    return {
      ...lead,
      lead: <>
        <b>{lead.name || "No name"}</b><br/>
        {`${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`}<br/>
        {lead.date}<br/><br/>
        {lead.comments || "No comments"}<br/>
      </>,
      contact: <>
        {lead.phone || "No phone"}<br/>
        {lead.email || "No email"}<br/>
      </>,
      thumbnail: <img style={{ maxHeight: 90, maxWidth: 120, marginBottom: 10}} src={car.thumbnail || "/missing_image.jpeg"} alt="image"/>,
      carTitle: `${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`,
      rowLink: `/lead/${lead.id}`,
      carTitleLink: `/lead/${lead.id}`,
      thumbnailLink: `/lead/${lead.id}`, //`/car/${car.stock}`,
      age: moment().diff(moment(lead.date), 'days'),
      indicator: isNew(lead) && NewItemIcon(),
    }
  })
  .sort(function(a,b){
    const dateFormat = "YYYY-MM-DD-hh-mm-ss";
    return moment(b.sortDate || cleanSortDate(b.date), dateFormat).valueOf() - moment(a.sortDate || cleanSortDate(a.date), dateFormat).valueOf();
    });


  const summary = [
    {label: 'Average Age', value: (Math.round(100*rows.reduce((a,c) => a + (c.age || 0), 0)/leads.length)/100)+" days"},
    {label: 'Total', value: leads.length},
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

function NewItemIcon() {
  return (
    <Badge
      color="primary"
      variant="dot"
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <NewReleasesIcon color='secondary' />
    </Badge>
  );
}

function isNew(lead) {
  const statusTime = moment(lead.status_time, "YYYY-MM-DD HH:mm:ss");

  switch (lead.status) {
    case 'pending contact':
      // If leads.contacts is empty, return true
      return !lead.contacts || lead.contacts.length === 0;

    case 'unresponsive':
      // Check if all contact times are before the threshold
      const threshold = moment().subtract(24, 'hours');
      return (lead.contacts || []).every(contact => {
        const contactTime = moment(contact.timestamp, "YYYY/MM/DD HH:mm");
        return contactTime.isBefore(threshold);
      });
    case 'qualifying':
      console.log(lead.contacts)
      // If all items in leads.contacts are older than lead.status_time, return true
      return (lead.contacts || []).every(contact => {
        const contactTime = moment(contact.timestamp, "YYYY/MM/DD HH:mm");
        return contactTime.isBefore(statusTime);
      });

    default:
      // Handle any other type or invalid type
      return false;
  }
}