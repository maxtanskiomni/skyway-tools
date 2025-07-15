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
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp, FileCopy } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select } from '@mui/material';
import moment from 'moment';

import Badge from '@mui/material/Badge';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';


const headers = {
  base: [ 
    {key:'thumbnail', label:'Car'}, 
    {key:'lead', label:'Lead'}, 
    {key:'contact', label:'Contact Methods', noLink: true}, 
    {key:'salesRep', label:'Sales Rep'}, 
    {key:'actions', label:'', noLink: true}, 
  ],
  indicator: [ 
    {key:'indicator', label:'New'},
    {key:'thumbnail', label:'Car'}, 
    {key:'lead', label:'Lead'}, 
    {key:'contact', label:'Contact Methods', noLink: true}, 
    {key:'salesRep', label:'Sales Rep'}, 
    {key:'actions', label:'', noLink: true}, 
  ]
};


export default function Leads(props) {
  const { items = [], type = "base", showSummary } = props;
  const [leads, setLeads] = React.useState(items)

  const rows = leads.map(lead => {
    const {car = {}} = lead;

    const leadText = `${lead.name}\n${`${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`}\n\n${lead.phone || "No phone"}`;

    return {
      ...lead,
      lead: <>
        <b>{lead.name || "No name"}</b><br/>
        {`${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`}<br/>
        {lead.date}<br/><br/>
        {lead.comments || "No comments"}<br/>
      </>,
      contact: <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {lead.phone || "No phone"}
          {lead.phone && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(lead.phone)
                  .then(() => StateManager.setAlertAndOpen("Phone number copied!"))
                  .catch(() => StateManager.setAlertAndOpen("Failed to copy phone number", "error"));
              }}
            >
              <FileCopy fontSize="small" />
            </IconButton>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {lead.email || "No email"}
          {lead.email && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(lead.email)
                  .then(() => StateManager.setAlertAndOpen("Email address copied!"))
                  .catch(() => StateManager.setAlertAndOpen("Failed to copy email address", "error"));
              }}
            >
              <FileCopy fontSize="small" />
            </IconButton>
          )}
        </div>
      </>,
      thumbnail: <img 
        style={{ maxHeight: 90, maxWidth: 120, marginBottom: 10, cursor: 'pointer'}} 
        src={car.thumbnail || "/missing_image.jpeg"} 
        alt="image"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const response = await fetch(car.thumbnail || "/missing_image.jpeg");
            const imgBlob = await response.blob();
            
            // Convert image to PNG if needed
            let pngBlob = imgBlob;
            if (imgBlob.type !== "image/png") {
              const imageBitmap = await createImageBitmap(imgBlob);
              const canvas = document.createElement("canvas");
              canvas.width = imageBitmap.width;
              canvas.height = imageBitmap.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(imageBitmap, 0, 0);
              const pngDataUrl = canvas.toDataURL("image/png");
              pngBlob = await (await fetch(pngDataUrl)).blob();
            }
            
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": pngBlob
              })
            ]);
            StateManager.setAlertAndOpen("Image copied!");
          } catch (err) {
            console.error("Failed to copy image: ", err);
            StateManager.setAlertAndOpen("Failed to copy image", "error");
          }
        }}
      />,
      carTitle: `${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`,
      rowLink: `/lead/${lead.id}`,
      carTitleLink: `/lead/${lead.id}`,
      thumbnailLink: `/lead/${lead.id}`, //`/car/${car.stock}`,
      age: moment().diff(moment(lead.date), 'days'),
      indicator: isNew(lead) && NewItemIcon(),
      // rowAction: () => copyLead(leadText, car.thumbnail || "/missing_image.jpeg"),
      actions: (
        <>
          <IconButton onClick={() => copyLead(leadText, car.thumbnail || "/missing_image.jpeg")} aria-label="copy to clipboard">
            <FileCopy fontSize="small" />
          </IconButton>
          <IconButton 
            onClick={() => copyTemplatedSMS(lead, car)} 
            aria-label="copy SMS template"
          >
            <AutoFixHighIcon fontSize="small" />
          </IconButton>
        </>
      ),
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
      if(!!lead.phone) return !lead.contacts || lead.contacts.filter(c => ["phone", "text"].includes(c.type)).length < 1;
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



async function copyLead(text, imageUrl) {
  try {
    const textClipboardItem = new ClipboardItem({
      "text/plain": new Blob([text], { type: "text/plain" }),
    });

    // Copy only the text to the clipboard
    await navigator.clipboard.write([textClipboardItem]);
    StateManager.setAlertAndOpen("Lead copied!")
  } catch (err) {
    console.error("Failed to copy: ", err);
    StateManager.setAlertAndOpen("Failed to copy lead", "error");
  }
}

function copyTemplatedSMS(lead, car) {
  const message = `Hi ${lead.name?.split(' ')[0] || ''}, this is ${StateManager.userName || ''} from Skyway Classics. Thanks for reaching out about our ${car.year || ''} ${car.make || ''} ${car.model || ''}. Yes it is still available. How can I help you with the vehicle?`;
  
  navigator.clipboard.writeText(message)
    .then(() => {
      StateManager.setAlertAndOpen("SMS template copied!");
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      StateManager.setAlertAndOpen("Failed to copy SMS template", "error");
    });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}