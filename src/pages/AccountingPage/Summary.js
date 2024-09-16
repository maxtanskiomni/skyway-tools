import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import RequestManager from '../../utilities/requestManager.js';
import firebase from '../../utilities/firebase';
import moment from 'moment';
import { StateManager } from '../../utilities/stateManager';

import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CheckIcon from '@mui/icons-material/Check';
import { Construction, ThumbUp } from '@mui/icons-material';


export default function Summary(props) {
  const {data = {}} = props;
  const { summary = {}, outstanding_checks = [], payables = [], inventory = [], funding = [], orders =[] } = data;
  const ronChecks = outstanding_checks.filter(check => check.recipient.toUpperCase().includes("RON'S"));
  const otherChecks = outstanding_checks.filter(check => !check.recipient.toUpperCase().includes("RON'S") || check.force_vis);
  const credit = ronChecks.filter(check => moment(check.date).isSameOrBefore(moment())).reduce((a,c) => a + c.amount, 0);
  const checks = otherChecks.filter(check => check.force_vis || moment(check.date).isSameOrBefore(moment())).reduce((a,c) => a + c.amount, 0);
  const nonNTOs = payables.filter(x => !x.isNTO).reduce((a,c) => a + (c.amount || 0), 0);
  const NTOs = payables.filter(x => x.isNTO && x.isFunded).reduce((a,c) => a + (c.amount || 0), 0);
  const LOCs = (summary.seacoastLOCBalance || 0)
  // console.log(inventory.filter(x => x.value < 0))

  const skywayInventory = inventory.filter(x => x.value > 0).reduce((a,c) => a + (c.value || 0), 0);
  const ronInventory = ronChecks.reduce((a,c) => a + c.amount, 0);

  const service_receivables = orders.filter(x => x.invested_cost > 0).reduce((a,c) => a + (c.receivable || 0), 0);
  const service_net_inventory = orders.filter(x => x.invested_cost > 0).reduce((a,c) => a + (c.net_inventory || 0), 0);

  const net_cash = (summary.mercuryBalance + summary.wellsFargoBalance + summary.seacoastBalance + summary.pilotBalance + summary.cashBalance - checks) || 0;
  const accounts_receiveable = funding.reduce((a,c) => a + c.deals.reduce((a,c) => a + c.amount, 0), 0);
  const working_capital = service_receivables + skywayInventory + net_cash - NTOs - LOCs + accounts_receiveable*0.14;
  const current_ratio = ((service_receivables + skywayInventory + net_cash) / (NTOs+LOCs)) * 100;


  const net_cash_nto = net_cash - NTOs;
  const net_inv_loc = skywayInventory - LOCs;

  React.useEffect(() => {
    const db = firebase.firestore();
    const date = moment().format("YYYY-MM-DD");
    db.collection("accounting-summaries").doc(date).set({
      date,
      ...summary,
      checks,
      net_cash,
      ronInventory,
      skywayInventory,
      NTOs,
      nonNTOs,
      accounts_receiveable,
      working_capital,
      current_ratio,
      service_receivables,
      service_net_inventory,
      net_cash_nto,
      net_inv_loc,
    })
  }, [])
  // const skywayInventory = totalInventory - ronInventory;
  
  const downloadStatements = async () => {
    const locations = ['Pilot Statement.pdf', 'WF Statement.pdf'];
    locations.forEach(async location => {
      let link = document.createElement('a');
      link.href = await firebase.storage().ref('statements/'+location).getDownloadURL();
      link.target = "_blank";
      link.click();
    });
  }

  const syncChecks = async () => {
    StateManager.setLoading(true);
    const {status} = await RequestManager.get({function: 'syncChecks'});
    StateManager.setLoading(false);
    StateManager.reload();
  }

  return (
    <Paper>
      {
        StateManager.pageLoading ||
        <div>
          <Typography variant="h6" color="inherit" noWrap>
            Accounting Summary
          </Typography>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">
              Last Update: {summary.lastAccountingUpdate}
              {
              moment(summary.lastAccountingUpdate).isBefore(moment().subtract(24, "hours")) 
                ? <QueryBuilderIcon style={{ marginLeft: 10,  fontSize: 24, color:"gray" }} /> 
                : <ThumbUp style={{ marginLeft: 10, fontSize: 24, color:"green" }} />
              }
            </Typography>
          

            
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Account Balances:</Typography>
            <Typography variant="p" display="block">Mercury: ${(summary.mercuryBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">WF: ${(summary.wellsFargoBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Seacoast: ${(summary.seacoastBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Pilot: ${(summary.pilotBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Funds Clearing: ${(summary.clearingBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Cash: ${(summary.cashBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Checks Outstanding: ${checks.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Net Balance: ${net_cash.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Ron Overdue: ${credit.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Lines of Credit:</Typography>
            <Typography variant="p" display="block">Seacoast: ${(summary.seacoastLOCBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            {/* <Typography variant="p" display="block">Total: ${totalInventory.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography> */}
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Inventory:</Typography>
            <Typography variant="p" display="block">Ron Cars: ${ronInventory.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Skyway Owned Inventory: ${skywayInventory.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Service Bookings Value: ${service_receivables.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            {/* <Typography variant="p" display="block">Total: ${totalInventory.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography> */}
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Payables:</Typography>
            <Typography variant="p" display="block">NTOs Due: ${NTOs.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Non NTOs Due: ${nonNTOs.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Total Payables: ${(nonNTOs + NTOs).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Uncollected Funds:</Typography>
            {
              funding.map(period => {
                let readableMonth = moment(period.month).format("MMM YYYY");
                let amount = period.deals.reduce((a,c) => a + c.amount, 0);
                if(amount <= 0.01) return;
                console.log(readableMonth, amount);
                return (
                  <Typography variant="p" display="block">{readableMonth}: ${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
                )
              })
            }
            <Typography variant="p" display="block">Total: ${accounts_receiveable.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
          </div>

          <div style={{marginTop:10, marginBottom:10}}>
            <Typography variant="p" display="block">Key Performance Indicators</Typography>
            <Typography variant="p" display="block">Net Working Capital: ${working_capital.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Current Ratio: {current_ratio.toLocaleString(undefined, {minimumFractionDigits: 2})}%</Typography>
            <Typography variant="p" display="block">Net Cash to NTO: ${net_cash_nto.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
            <Typography variant="p" display="block">Net INV to LOC: ${net_inv_loc.toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
          </div>

          <div>
            <Button variant="contained" color="secondary" style={{marginTop: '20px'}} onClick={downloadStatements}>
              Download Statements
            </Button>
            <Button variant="contained" color="primary" style={{marginTop: '20px'}} onClick={syncChecks}>
              Sync Checks
            </Button>
          </div>
        </div>
      }
    </Paper>
  );
}