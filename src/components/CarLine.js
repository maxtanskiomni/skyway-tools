import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';
import { Typography } from '@mui/material';
import moment from 'moment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import firebase from '../utilities/firebase.js';
import { StateManager } from '../utilities/stateManager.js';


export default function CarLine(props) {
  let {car={}} = props;
  const [alert, setAlert] = React.useState("");
  const [cost, setCost] = React.useState("No Cost");
  car.cost = cost;
  car.title = `${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`;
  car.market_price = ((car.market_price) || "No Price").toLocaleString();
  car.price = ((car.price) || "No Price").toLocaleString();
  car.miles = +(car?.miles || "").replace(/,/g, "");
  car.miles = isNaN(car.miles) ? "No Miles" : car.miles.toLocaleString()
  car.status = car.status;
  car["days-in-stock"] = `${moment().diff(moment(car.date), 'days')}`;

  const published = (
    <>
    {car.publish_status == "Unpublished" && <HighlightOffIcon style={{ fontSize: 18, color:"red" }} />}
    {car.publish_status == "Published" && <CloudDoneIcon style={{ fontSize: 18, color:"green" }} />}
    {car.publish_status == "Not Live" && <PauseCircleFilledIcon style={{ fontSize: 18, color:"gray" }} />}
    </>
  )

  React.useEffect(async () => {
    const expenses = await firebase.firestore().collection("purchases").where("stock", "==", car.stock).get();
    const total = expenses.docs.reduce((a,c) => a + c.data().amount , 0);
    // StateManager.addToValue is not available, so we'll skip this call
    setCost(total.toLocaleString())
    let currentPrice = +car.price.replace(",", "");
    currentPrice = isNaN(currentPrice) ? 0 : currentPrice || 0;
    let marketPrice = +car.market_price.replace(",", "");
    marketPrice = isNaN(marketPrice) ? 0 : marketPrice || 0;
    console.log(currentPrice, marketPrice, currentPrice > 1.1 * marketPrice)
    if(currentPrice > 1.1 * marketPrice && marketPrice > 0) return setAlert(
      <>
        <ReportProblemIcon style={{ fontSize: 18, color:"red" }} />
        {currentPrice > 1.20 * marketPrice && <ReportProblemIcon style={{ fontSize: 18, color:"red" }} />}
      </>
    );
  }, []);

  let fields = [
    {key: "title", subkey:"vin", width: "45%", alert: alert},
    {key: "market_price", width: "12%", prefix: car.market_price === "No Price" || "$"},
    {key: "price", width: "12%", prefix: car.price === "No Price" || "$"},
    {key: "cost", width: "12%", prefix: car.cost === "No Cost" || "$"},
    // {key: "miles", unit: getUnit("mile", car.miles), width: "12%"},
    {key: "status", subkey:"sub_status", alert: published, width: "12%"},
    {key: "days-in-stock", unit: getUnit("day", car["days-in-stock"]), width: "7%"},
  ];

  const isMobile = window.innerWidth <= 768;
  if(isMobile) fields = [fields[0]];

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
          <a style={{paddingBottom: 25, paddingRight: 10}} href={`/car/${car.stock}`}>
            <img style={{ maxHeight: 90, maxWidth: 120}} src={car.thumbnail || "/missing_image.jpeg"} alt="image"/>
          </a>
        </div>

        {
          fields.map((field, i) => 
            <div style={{width: field.width}}>
              <Typography align={i <= 0 ? 'left' : 'right'}>
                <a style={{textDecoration: 'none', color: "black"}} href={`/car/${car.stock}`}>
                  {field.prefix}{car[field.key]} {field.unit || ""}{field.alert || ""}
                </a>
              </Typography>
              <Typography variant="body2" align={i <= 0 ? 'left' : 'right'}>
                <a style={{textDecoration: 'none', color: "black"}} href={`/car/${car.stock}`}>
                  {car[field.subkey]}
                </a>
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
