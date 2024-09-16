import React from 'react';
import Grid from '@mui/material/Grid';
import DateLine from '../../components/DateLine';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';

import { StateManager } from "../../utilities/stateManager.js";
import { Typography } from '@mui/material';
import CarLine from '../../components/CarLine';
import TextLine from '../../components/TextLine';
import POCard from '../../components/POCard';
import CircularProgress from '@mui/material/CircularProgress';
import DepositLine from '../../components/DepositLine';
import LeadLine from '../../components/LeadLine';

let timeout = () => null
export default function ListPage(props) {
  const { type } = props;

  let params = getParams();

  const initTerm = params.q;
  const [list, setList] = React.useState([]);
  const [term, setTerm] = React.useState(initTerm || "");
  const [loading, setLoading] = React.useState(false);
  StateManager.setTitle(StateManager.formatTitle(type));

  const [note, setNote] = React.useState("Cost");
  const [noteValue, setNoteValue] = React.useState(0);
  // StateManager.addToValue = (v) => setNoteValue(noteValue+v);
  StateManager.addToValue = (v) => null; //setNoteValue(noteValue+v);

  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      let list = await queries[type](params).get();
      list = list.docs.map(processors[type]).sort(sorters[type]);
      //If not remove query filter
      if(!params.rqf) list = list.filter(item => queryFilter[params.qf || type]({item, ...params}));
      console.log(list)

      setList(list);

      StateManager.setLoading(false);
    }
    fetchData();
  }, [type]);

  const updateTerm = (id, value) => {
    console.log(value);
    if(value === null) value = ""
    setLoading(true);
    setTerm(value);
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      setLoading(false);
      const url = new URL(window.location.href);

      let newUrl = `${url.pathname}`.replace("/","");
      console.log("1 ", newUrl)
      if(!url.search) newUrl += `?q=${value}`;
      else {
        newUrl = `${newUrl}${url.search}`;
        //Place or replace the term variable
        if(newUrl.includes("?q=")) newUrl = newUrl.replace(/[?&]q=\w*/g,  `?q=${value}`);
        else if(newUrl.includes("&q=")) newUrl = newUrl.replace(/[?&]q=\w*/g,  `&q=${value}`);
        else newUrl += `&q=${value}`
        console.log("2 ", newUrl)
      }
      console.log("3 ", newUrl)

      history.replace(newUrl);
    }, 1000);
    // setTerm(value);
  }

  const filterByTerm = item => (filters[params.ft || type] || defaultFilter)(item, term);

  const items = list.filter(filterByTerm);

  return (
    <>
      <Grid style={{padding: 20}}>
        <TextLine
          id="filter"
          label={<b style={{paddingLeft: 7}}>Search {StateManager.formatTitle(type)}</b>}
          removeBox
          placeholder="Enter search term"
          value={term}
          onChange={updateTerm}
        />
      </Grid>
      {/* <div style={{textAlign: "right"}}>{note}: ${noteValue.toLocaleString(undefined, {minimumFractionDigits: 0})}</div> */}
      <div style={{textAlign: "right"}}>{items.length} items found</div>
      {headers[type] && headers[type](headerFields[type])}
      {
        loading ? <CircularProgress /> : items.map(components[type])
      }
    </>
  );
}

const carProcessor = car => {
  const {id} = car;
  car = car.data();
  car.publish_status = car.remove_date ? "Removed" : car.publish_date ? "Published" : "Not Live";
  return {
    ...car, 
    id, 
    price: car.price || "No Price",  
    miles: car.miles || "No miles", 
    hasTitle: car.title_front || "No title",
    consignor: car.consignor || "No consignor",
    isRonCar: car.consignor === "4ed13115-1900-41d2-a14d-13f1242dd48a" && "Ron car",
    vin: car.vin || "No ID",
    picture: car.thumbnail || "No pictures",
    ext_images: car.ext_images || "No exterior pictures",
    interior_images: car.interior_images || "No interior pictures",
    odometer_images: car.odometer_images || "No odometer pictures",
    vin_image: car.vin_image || "No vin pictures",
    engine_images: car.engine_images || "No engine pictures",
    stamping_images: car.stamping_images || "No stamping pictures",
    under_images: car.under_images || "No under pictures",
    video: car.youtube_link || "No video",
    writeup: car.writeup || "No writeup",
    nto: car.nto || "No NTO",
    market_price: car?.pricing?.excellent || null,
    overpriced: (car.price || 0) > 1.1*(car?.pricing?.excellent || 10000000) ? "overpriced": "",
  }
}

const processors = {
  inventory: carProcessor,
  "purchase-orders": item => ({status: "pending", ...item.data(), id: item.id}),
  deposits: item => ({...item.data(), id: item.id, amount: '$'+item.data().amount.toLocaleString()}),
  leads: item => ({salesRep: "Not Assigned", ...item.data(), id: item.id}),
}

const sorters = {
  inventory: (a,b) => +(b.stock.replace(/-.*/, "")) - (a.stock.replace(/-.*/, "")),
  "purchase-orders": (a,b) => b.position - a.position,
  deposits: (a,b) => new Date(b.date) - new Date(a.date),
  leads: (a,b) => moment(b.date).valueOf() - moment(a.date).valueOf(),
}

const queries = {
  inventory: (params) => firebase.firestore().collection("cars").where("status", params.i || "!=", params.v || "sold"),
  "purchase-orders": (params) => firebase.firestore().collection("parts").where("order_status", "==", "active"),
  deposits: (params) => firebase.firestore().collection("deposits"),
  leads: (params) => firebase.firestore().collection("leads").where("date", ">=", moment().subtract(6, "month").format("YYYY-MM-DD")),
}

const queryFilter = {
  inventory: ({item}) => !["terminated", "admin review", "service"].includes(item.status),
  "status-time": ({item, start, end}) => moment(item.status_time).isSameOrAfter(start) && moment(item.status_time).isSameOrBefore(end),
  "purchase-orders":  () => true,
  deposits:  () => true,
  leads: ({item}) => StateManager.isBackoffice() || [StateManager.userID].includes(item.sales_id),
}

const components = {
  inventory: car => <CarLine car={car} />,
  "purchase-orders": po => <POCard {...po} />,
  deposits: item => <DepositLine {...item} />,
  leads: lead => <LeadLine lead={lead} />,
}

const defaultFilter = (item = {}, term) => Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)
const filters = {
}

const headerFields = {
  inventory: [
    {key: "", width: "120px"},
    {key: "", width: "45%"},
    {key: "Market Price", width: "12%"},
    {key: "Price", width: "12%"},
    {key: "Cost", width: "12%"},
    {key: "Status", width: "12%"},
    {key: "Days", width: "7%"},
  ],
  leads: [
    {key: "Lead", width: "120px"},
    {key: "", width: "25%"},
    {key: "Phone", width: "17%"},
    {key: "Email", width: "15%"},
    {key: "Rep", width: "12%"},
    {key: "Date", width: "12%"},
    // {key: "Days", width: "7%"},
  ]
}

const Header = (props) => {
  let {fields = []} = props;
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
      {
        fields.map((field, i) => 
          <div style={{width: field.width}}>
            <Typography align={i <= 0 ? 'left' : 'right'}>
              <b style={{textDecoration: "underline"}}>{field.key}</b>
            </Typography>
          </div>
        )
      }
    </div>
  )
}

const headers = {
  inventory: (props) => <Header fields={props} />,
  leads: (props) => <Header fields={props} />
}

const getParams = () => {
  let p = new URL(window.location.href).search
                                      .replace("?","")
                                      .split("&")
                                      .map(x => x.split("="))
                                      .reduce((a,c) => Object.assign(a, {[c[0]]: c[1]}),{});

  if(p.i === "e") p.i = "==";
  else if(p.i === "ne") p.i = "!=";
  else if(p.i === "g") p.i = ">";
  else if(p.i === "ge") p.i = ">=";
  else if(p.i === "l") p.i = "<";
  else if(p.i === "le") p.i = "<=";

  if((p.v || "").includes("%20")) p.v = p.v.replace(/%20/g, " ");
  if((p.q || "").includes("%20")) p.q = p.q.replace(/%20/g, " ");

  return p;
}