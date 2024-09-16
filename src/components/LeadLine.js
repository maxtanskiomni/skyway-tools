import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';
import { Typography } from '@mui/material';
import moment from 'moment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import firebase from '../utilities/firebase.js';


export default function LeadLine(props) {
  let {lead={}} = props;
  const [car, setCar] = React.useState({});
  lead.phone = formatNumber(`${lead.phone}`);
  lead.email = lead.email;
  lead.rep = lead.salesRep;
  lead.date = moment(lead.date).format("M-D-YY");
  lead.days = `${moment().diff(moment(lead.date), 'days')}`;

  React.useEffect(async () => {
    if(!lead.stock) return;
    let car = await firebase.firestore().doc(`cars/${lead.stock}`).get();
    car = car.data() || {};
    car.title = `${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`;
    // car.price = ((car.price) || "No Price").toLocaleString();
    setCar(car);
  }, []);

  let fields = [
    {key: "name", subkey:"title", disclosure: "comments", width: "25%"},
    {key: "phone", width: "17%", fallback: "No Phone"},
    {key: "email", width: "15%", fallback: "No Email"},
    {key: "rep", width: "12%", fallback: "Not Assigned"},
    {key: "date", width: "12%"},
    // {key: "days", unit: getUnit("day", lead.days), width: "7%"},
  ];

  const isMobile = window.innerWidth <= 768;
  if(isMobile) fields = [fields[0]];

  const variables = Object.keys(lead)
  .filter(key => key !== 'l')
  .map(key => `${key}=${lead[key]}`).join("&");

  return (
      <div style={{
        backgroundColor: 'white', 
        padding: '17px',
        marginBottom: '3px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        // borderBottom: '2px solid black',
      }}>
        <div>
          <a style={{paddingBottom: 25, paddingRight: 10}} href={`/car/${lead.stock}`}>
            <img style={{ maxHeight: 90, maxWidth: 120}} src={car.thumbnail || "/missing_image.jpeg"} alt="image"/>
          </a>
        </div>

        {
          fields.map((field, i) => 
            <div style={{width: field.width}}>
              <Typography align={i <= 0 ? 'left' : 'right'}>
                {/* <a style={{textDecoration: 'none', color: "black"}} href={`/form/edit-lead?${variables}`}> */}
                <a style={{textDecoration: 'none', color: "black"}} href={`/lead/${lead.id}`}>
                  {field.prefix}{lead[field.key] || field.fallback} {field.unit || ""}{field.alert || ""}
                </a>
              </Typography>
              <Typography variant="body2" align={i <= 0 ? 'left' : 'right'}>
                {/* <a style={{textDecoration: 'none', color: "black"}} href={`/form/edit-lead?${variables}`}> */}
                <a style={{textDecoration: 'none', color: "black"}} href={`/lead/${lead.id}`}>
                  {car[field.subkey]}
                </a>
                <br/>
                <br/>
                {lead[field.disclosure] || ""}
              </Typography>
            </div>
          )
        }
      </div>
  );
}

const getUnit =(base, raw = "0") => {
  if(raw.includes("No")) return "";
  const ending = parseFloat(raw.replace(/,/g,"")) > 1 ? "s" : ""
  return `${base}${ending}`;
}

const formatNumber = (phoneNumberString) => {
  const cleaned = phoneNumberString.replace(/\D/g, '');
  
  // Format the phone number
  const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  
  // Return the formatted phone number
  return formatted;
}
