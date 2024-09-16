import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import makeStyles from '@mui/styles/makeStyles';
import firebase from '../../utilities/firebase';

import Store from '../../utilities/store.js';

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager';
import algolia from '../../utilities/algolia';
import constants from '../../utilities/constants';
import moment from 'moment';
import { Button } from '@mui/material';

import { QRCode } from 'react-qr-code';

export default function CarSummary(props) {
  const { car } = props;
  const classes = useStyles();

  const keysToRemove = (StateManager.isManager() || StateManager.isPorter()) ? [] : [
    "status",
    "sub_status",
    "status_time", 
  ];
  
  const data = [
    // {key:'stock', type: 'text'},
    {key:'year', type: 'text'},
    {key:'make', type: 'text'},
    {key:'model', type: 'text'},
    {key:'trim', type: 'text'},
    {key:'color', type: 'text'},
    {key:'vin', type: 'text'},
    {key:'title_number', type: 'text'},
    {key:'miles', type: 'text'},
    {key:'price', type: 'text'},
    {key:'engine-type', type: 'text'},
    {key:'interior-color', type: 'text'},
    {key:'interior-material', type: 'text'},
    {key:'transmission', label: 'Transmission', type: 'select', values: constants.trans_types.map(x => ({label: formatTitle(x), value:x}))},
    {key:'status', type: 'select', values: constants.statuses.filter(x => x != "active" || StateManager.isManager()).map(x => ({label: formatTitle(x), value:x})), callback: timeUpdate},
    {key:'sub_status', label: 'Sub Status', type: 'select', values: constants.sub_statuses.map(x => ({label: formatTitle(x), value:x})), callback: timeUpdate},
    {key:'status_time', type: 'text'},
    {key:'is_actual', label: 'Actual Miles', type: 'check'},
    {key:'is_excess', label: 'Miles In Excess', type: 'check'},
    {key:'is_exempt', label: 'Miles Exempt', type: 'check'},
    {key:'odometer_5', label: '5-Digit Odometer', type: 'check'},
    {key:'odometer_6', label: '6-Digit Odometer', type: 'check'},
    {key:'ready_to_deliver', label: 'Ready to Deliver', type: 'check'},
  ].filter(x => !keysToRemove.includes(x.key));

  const publish_status = constants.statuses.slice(-4).includes(car.status) ? "Removed" : constants.statuses.slice(0,2).includes(car.status) ? "Not Live" : "Published";
  const published = (
    <>
    {publish_status == "Unpublished" && <HighlightOffIcon style={{ fontSize: 18, color:"red" }} />}
    {publish_status == "Published" && <CloudDoneIcon style={{ fontSize: 18, color:"green" }} />}
    {publish_status == "Not Live" && <PauseCircleFilledIcon style={{ fontSize: 18, color:"gray" }} />}
    </>
  )

  const title = `${car.year || ""}${car.year ? " " : ""}${car.make || ""}${car.make ? " " : ""}${car.model || ""}`;
  const slug = car.slug || "/"+`${car.stock}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');


  const handlePrint = () => {
    const price = car.price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) || "Coming Soon";
    let writeup = car.writeup  || "Writeup Coming Soon";
    const engine = car['engine-type'] || "Coming Soon";
    const transmission = car.transmission || "Coming Soon";
  
    // Open a new print window
    const printWindow = window.open('', '', 'height=800,width=800');
  
    // Style for the print content
    const printStyles = `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
        }
        .print-container {
          text-align: center;
        }
        .title, .engine, .transmission. stock {
          font-weight: bold;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .price {
          font-size: 20px;
          margin-bottom: 20px;
        }
        .writeup {
          text-align: justify;
          margin-top: 20px;
        }
        .label {
          font-weight: bold;
        }
      </style>
    `;

    // Estimate if the writeup is too long and adjust accordingly
    const maxWriteupLength = 3750; // Adjust based on your estimation for one-page content
    if (writeup.length > maxWriteupLength) {
      writeup = `${writeup.substring(0, maxWriteupLength)}...`; // Truncate and add ellipsis
    }
  
    // Construct print content with dynamic data and labels
    const printContent = `
      <div class="print-container">
        <div class="title">${title}</div>
        <div class="price">${price}</div>
        <div class="stock"><span class="label">Stock Number:</span> ${car.stock}</div>
        <div class="engine"><span class="label">Engine:</span> ${engine}</div>
        <div class="transmission"><span class="label">Transmission:</span> ${transmission}</div>
        <div class="writeup">${writeup}</div>
      </div>
    `;
  
    // Write and print the content
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write(printStyles); // Add the styles
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent); // Add the content
    printWindow.document.write('</body></html>');
    printWindow.document.close(); // Close the document for writing, ready for printing
    printWindow.focus(); // Focus on the print window to ensure print dialog appears on top
    printWindow.print(); // Open the print dialog
    printWindow.close(); // Optionally close the print window after printing
  };

  return (
    <Paper className={classes.paper}>
      <div style={{
        display: 'flex', 
        flexDirection: StateManager.windowDimensions.width > 700 || "column-reverse"}}
      >
        <Grid container spacing={3} style={{position: 'relative'}}>
          { 
            data.map(item => (
              <>
                <Grid item xs={12} sm={6} style={{display: "flex", justifyContent:'flex-start'}}>
                  <RenderInput item={item} car={car}/>
                </Grid>
                <Grid item xs={12} sm={6}></Grid>
              </>
            ))
          }
        </Grid>
        <div style={{paddingBottom: 25}}>
          <a style={{paddingBottom: 10}} href={`https://skywayclassics.com/vehicles${slug}`} target="_blank">
            {car.thumbnail && <img style={{ height: 240, width: 320 }} src={car.thumbnail} />}
          </a>
          <h2>Publish Status: {publish_status} {published}</h2>
          <h3>Updated Date: {car.status_time}</h3>
          <h3>Video Status: {car.youtube_link ? "Published" : "Pending"}</h3>
          <Button color="primary" variant="contained" onClick={handlePrint}>
            Print Window Sticker
          </Button>
          <Button color="secondary" variant="contained" onClick={() => printQR(car.stock)}>
            Print QR Code
          </Button>
          <div id="QRCode" class="print-container" style={{display: "none"}}>
            <QRCode value={`https://tools.skywayclassics.com/handle-scan/${car.stock}`} />
          </div>
        </div>
      </div>
    </Paper>
  );
}

const RenderInput = (props) => {
  const {item, car} = props;

  const updateCar = (data) => {
    const newCar = {...car, ...data};
    car.updater(newCar);
  }

  const [value, setValue] = React.useState(car[item.key]);

  const onChange = async (e) => {
    let {value, name, id} = e.target;
    value = value.trim();
    console.log(value);
    const number_values = ["price"];
    if(number_values.includes(id)) value = +value;
    const data = {[id || name]: value};
    await firebase.firestore().collection('cars').doc(car.stock).set({...data, needsDAUpdate: true}, {merge:true});
    setValue(value);
    updateCar(data);

    if(!!props.item.callback){
      props.item.callback({...e.target, docID: car.stock});
    }

    const dontUpdateAlgolia = [id, name].map((x = "") => x.includes("status")).reduce((a,c) => a || c, false);
    if(dontUpdateAlgolia) return;

    if(id == "vin") {
      const vin = value;
      data.vin_suffixes = [vin.slice(-6), vin.slice(-5), vin.slice(-4)]
    }
    algolia.updateRecord("cars", {
      objectID: car.stock, 
      stock: car.stock,
      stock_num: +(car.stock.slice(0, -3)), 
      ...data
    });
  }

  const check = async (e) =>{
    const data = {[e.target.id]: e.target.checked};
    await firebase.firestore().collection('cars').doc(car.stock).set(data, {merge:true});
    updateCar(data);
  }

  if(item.type === "text"){
    return (
      <TextField
        defaultValue={car[item.key] || ''}
        onBlur={onChange}
        id={item.key}
        name={item.key}
        label={formatTitle(item.key)}
        fullWidth
      />
    )
  } else if (item.type === "select") {
    return (
      <FormControl fullWidth required>
        <InputLabel id={item.key}>{formatTitle(item.key)}</InputLabel>
        <Select
          labelId={item.key}
          id={item.key}
          name={item.key}
          value={value}
          onChange={onChange}
        >
          {item.values.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
        </Select>
      </FormControl>
    )
  } else if (item.type === "check") {
    return (
      <FormControlLabel 
        control={<Checkbox id={item.key} defaultChecked={car[item.key]} onClick={check} />} 
        label={item.label}  
        style={{textAlign: 'left'}} 
      />
    )
  }

}

const formatTitle = raw => {
  raw = raw.split('_');
  raw = raw.join(' ');
  if(raw.includes("-")){
    raw = raw.split('_');
    raw = raw.join(' ');
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    marginBottom: '10px'
  },
}));

const timeUpdate = update => {
  const {id, name} = update;
  const status_time = moment().format("YYYY/MM/DD");
  const data = {[(id || name)+"_time"]: status_time};
  firebase.firestore().collection('cars').doc(update.docID).set(data, {merge:true});
}


const printQR = (stock) => {
  //Get the QR code
  const printContent = document.getElementById('QRCode');
  console.log(printContent)

  // Open a new print window
  const printWindow = window.open('', '', 'height=800,width=800');

  // Style for the print content
  const printStyles = `
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 20px;
      }
      .print-container {
        text-align: center;
      }
      .title, .engine, .transmission. stock {
        font-weight: bold;
        font-size: 24px;
        margin-bottom: 10px;
      }
      .price {
        font-size: 20px;
        margin-bottom: 20px;
      }
      .writeup {
        text-align: justify;
        margin-top: 20px;
      }
      .label {
        font-weight: bold;
      }
    </style>
  `;

  // Write and print the content
  printWindow.document.write('<html><head><title>Print</title>');
  printWindow.document.write(printStyles); // Add the styles
  printWindow.document.write('</head><body>');
  printWindow.document.write(printContent.innerHTML); // Add the content
  printWindow.document.write('</body></html>');
  printWindow.document.close(); // Close the document for writing, ready for printing
  printWindow.focus(); // Focus on the print window to ensure print dialog appears on top
  printWindow.print(); // Open the print dialog
  printWindow.close(); // Optionally close the print window after printing
};