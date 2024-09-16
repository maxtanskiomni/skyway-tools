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
import { Add, Delete } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

const tableSettings = {
  headers: [
    {key:'year', label:'Year'},
    {key:'make', label:'Make'}, 
    {key:'model', label:'Model'},
    {key:'vin', label:'VIN'}, 
    {key:'trade', label:'Trade Amount', format:'usd'}, 
    {key:'payoff', label:'Payoff', format:'usd'}, 
    {key:'netTrade', label:'Net Trade', format:'usd'}, 
    {key:'actions', label:'Actions', noLink: true}
  ],
  title: "", 
};

let addPaths = {};
let stockNumber = "";
export default function Trades(props) {
  const { deal = {} } = props;
  stockNumber = deal.car;
  const [trades, setTrades] = React.useState(deal.trades || []);
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] =React.useState({});
  const [tradeValue, setValue] = React.useState(0);
  const [bigChecked, setBigChecked] = React.useState(tradeValue > 0);

  React.useLayoutEffect(() => {
      setBigChecked(trades.length > 0);
  }, [trades]);

  const newTrade = () => {
    const trade = uuidv4();
    const tab = new URL(window.location.href).searchParams.get("tab");
    history.push(`/form/trade?stock=${stockNumber}&redirect=car&t=${trade}&tab=${tab}`)
  };

  const deleteRow = async (id) => {
    setLoading(true);
    const remove = firebase.firestore.FieldValue.arrayRemove(id);
    await firebase.firestore().doc('deals/'+stockNumber).update({trades: remove});
    await firebase.firestore().collection('trades').doc(id).delete();
    const newTrades = trades.filter(x => x !== id);
    setTrades(newTrades);
  }

  React.useEffect(() => {
    async function fetchData() {
      const tradeData = await getTrades(trades, deleteRow);

      setValue(tradeData.totalTradeValue);
      setData({
        rows: tradeData.rows,
        ...tableSettings,
      });
      setLoading(false);
    }
    fetchData();
  }, [trades]);

  return (
    <Accordion>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
        >
          <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <FormControlLabel control={<Checkbox checked={bigChecked} onClick={e => e.stopPropagation()} />} label={"Net Trade Value"} />
            <Typography variant='body1' style={{display: 'flex', alignItems: "center"}}>
              ${(tradeValue || 0).toLocaleString(undefined, {minimumFractionDigits:2})}
            </Typography>
          </div>
        
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
                {
                  loading 
                    ? <CircularProgress />
                    : <SimpleTable {...tableData} disabled={props.disabled}/>
                }
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={newTrade} disabled={props.disabled}>
                Add New Trade
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
    </Accordion>
  );
}


const DeleteButton = (id, deleteRow) => {
  return <>
    <IconButton
      aria-label="delete"
      onClick={(e) => {
        e.stopPropagation();
        deleteRow(id);
        }}
      size="large">
      <Delete />
    </IconButton>
    <IconButton
      aria-label="add-car"
      color="primary"
      onClick={(e) => {
        history.push(addPaths[id]);
        }}
      size="large">
      <Add />
    </IconButton>
  </>;
}

const getTrades = async (tradeIDs, deleteMethod) => {
  const db = firebase.firestore();
  const docs = tradeIDs.map(id => db.doc('trades/'+id).get());
  const tradeDocs = await Promise.all(docs);
  const totalTradeValue = tradeDocs.map(doc => (doc.data() || {}).trade).reduce((a,c) => a + c, 0);

  tradeDocs.forEach(async doc => {
    const trade = doc.data();
    const counters = await firebase.firestore().doc('admin/counters').get();
    const new_stock = counters.data().lastStock + 1;
    addPaths[doc.id] = `/form/add-car?stock=${new_stock}&year=${trade.year}&make=${trade.make}&model=${trade.model}&vin=${trade.vin}`;
  })
  
  const promises = tradeDocs.map( 
    async doc => {
      const trade = doc.data();
      return {
        id: doc.id, 
        ...trade,
        rowLink: `/form/trade?t=${doc.id}&stock=${stockNumber}&year=${trade.year}&make=${trade.make}&model=${trade.model}&vin=${trade.vin}&trade=${trade.trade}&payoff=${trade.payoff}&redirect=car&tab=sales`,
        actions: DeleteButton(doc.id, deleteMethod),
      }
    }
  );

  const rows = await Promise.all(promises);

  return {rows, totalTradeValue}
}
