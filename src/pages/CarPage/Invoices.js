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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Delete } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

export default function Invoices(props) {
  const { stockNumber, deal = {}, invoices = [], type = "sales" } = props;
  // const [tableData, setData] =React.useState({});
  const params = settings[type];
  let initChecked = {};
  invoices.forEach(doc => initChecked[doc.id] = doc.id === deal[params.key]);
  const [checked, setChecked] = React.useState(initChecked);


  const initValue = invoices.filter(doc => doc.id ==  deal[params.key])
                        .map(doc => doc.total)
                        .reduce((a,c) => a + c, 0);
  const [value, setValue] = React.useState(initValue);
  const [bigChecked, setBigChecked] = React.useState(value > 0);
  
  React.useLayoutEffect(() => {
      setBigChecked(value > 0)
  }, [value]);

  const selectRow = async (id) => {
    if(stockNumber) await firebase.firestore().doc('deals/'+stockNumber).set({[params.key]: id}, {merge:true});

    let newChecked = {}
    invoices.forEach(doc => newChecked[doc.id] = doc.id === id);
    setChecked(newChecked);

    const newValue = invoices.filter(doc => doc.id ==  id)
                              .map(doc => doc.total)
                              .reduce((a,c) => a + c, 0);
    setValue(newValue);
  }

  const Selector = (id) => (
    <Checkbox checked={checked[id]} onClick={(e) => selectRow(id)} disabled={props.disabled} />
  );

  const makeInvoice = () => {
    const invoice = uuidv4();
    const tab = new URL(window.location.href).searchParams.get("tab");
    const redirect = `../car/${stockNumber}`;
    history.push(`/form/${params.form}?stock=${stockNumber}&redirect=${redirect}&tab=${tab}&i=${invoice}`)
  };

  const rows = invoices.map( 
    doc => {
      const variables = Object.keys(doc)
        .filter(key => key !== 'total')
        .map(key => `${key}=${doc[key]}`).join("&");
      // console.log(variables)
      const tab = new URL(window.location.href).searchParams.get("tab");
      const redirect = `../car/${stockNumber}`;
      return {
        id: doc.id, 
        ...doc,
        taxes: doc.salesTax + doc.surtax,
        actions: Selector(doc.id),
        rowLink: `../form/${params.form}?i=${doc.id}&${variables}&tab=${tab}&redirect=${redirect}`,
        // rowAction: () => showFile(doc.data().files[0])
      }
    }
  );

  const tableData = {
    rows,
    headers: params.headers,
    title: props.title, 
  };


  return (
    <Accordion>
      <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
          <FormControlLabel control={<Checkbox checked={bigChecked} onClick={e => e.stopPropagation()} />} label={params.label} />
          <Typography variant='body1' style={{display: 'flex', alignItems: "center"}}>
            ${(value || 0).toLocaleString(undefined, {minimumFractionDigits:2})}
          </Typography>
        </div>
      
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SimpleTable {...tableData} disabled={props.disabled}/>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={makeInvoice} disabled={props.disabled}>
              Make New Invoice
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

const settings = {
  sales:{
    label: "Invoices",
    form: "deal",
    key: "invoice",
    headers: [{key:'actions', label:'Actions'}, {key:'cashPrice', label:'Price', format:'usd'}, {key:'docFee', label:'Doc Fee', format:'usd'}, {key:'titleFee', label:'Title Fee', format:'usd'}, {key:'tagFee', label:'Tag Fee', format:'usd'},  {key:'conciergeFee', label:'Concierge Fee', format:'usd'}, {key:'taxes', label:'Taxes', format:'usd'}, {key:'total', label:'Total Amount', format:'usd'}],
  },
  shipping:{
    label: "Shipping Invoices",
    form: "shipping",
    key: "shipping",
    headers: [{key:'actions', label:'Actions'}, {key:'origin', label:'Origin Zip'}, {key:'destination', label:'Destination Zip'}, {key:'price', label:'Price', format:'usd'}, {key:'adjustments', label:'Adjustments', format:'usd'}, {key:'total', label:'Total Amount', format:'usd'}],
  },
  shipping_in:{
    label: "Shipping To Skyway Invoices",
    form: "shipping_in",
    key: "shipping_in",
    headers: [{key:'actions', label:'Actions'}, {key:'price', label:'Price', format:'usd'}, {key:'adjustments', label:'Adjustments', format:'usd'}, {key:'total', label:'Total Amount', format:'usd'}],
  },
  finance:{
    label: "Finance Invoices",
    form: "finance",
    key: "finance",
    headers: [{key:'actions', label:'Actions'}, {key:'conciergeFee', label:'Concierge Fee', format:'usd'}, {key:'participationFee', label:'Participation Fee', format:'usd'}, {key:'adjustments', label:'Adjustments', format:'usd'}, {key:'total', label:'Total Amount', format:'usd'}],
  }
}
