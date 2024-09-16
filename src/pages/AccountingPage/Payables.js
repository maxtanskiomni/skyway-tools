import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, AssignmentTurnedIn, Create } from '@mui/icons-material';
import TextLine from '../../components/TextLine';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import firebase from '../../utilities/firebase';
import moment from 'moment';
import { StateManager } from '../../utilities/stateManager';
import RequestManager from '../../utilities/requestManager';

const headers = [
  {key:'date', label:'Date'},
  {key:'vendor', label:'Vendor'}, 
  {key:'car', label:'Car'},
  {key:'memo', label:'Memo'}, 
  {key:'amount', label:'Amount', format:'usd'}, 
  {key:'actions', label:'Actions', noLink:true}
]

export default function Payables(props) {
  const { data = {} } = props;
  const { payables = [] } = data;
  const [printDisabled, setPrint] = React.useState(false);
  StateManager.setPrint = setPrint;
  const [term, setTerm] = React.useState("");
  const [loading, setLoading] = React.useState([]);
  const [hide, setHide] = React.useState([]);
  StateManager.addToLoading = id => setLoading(loading.concat(id).flat());
  StateManager.removeFromLoading = id => setLoading(loading.filter(x => ![id].flat().includes(x)));
  StateManager.addToHide = id => setHide(hide.concat(id).flat());
  StateManager.removeFromHide = id => setHide(hide.filter(x => ![id].flat().includes(x)));
  // console.log(payables.map(payable => payable.stock))

  let rows = payables.map(payable => {

    const variables = Object.keys(payable)
                            .filter(key => key !== 'e')
                            .map(key => `${key}=${payable[key]}`).join("&");
    const tab = new URL(window.location.href).searchParams.get("tab");

    const depDates =(payable.deposits || []).map(doc => doc.date || 0).slice(-1);
    let relevantDate = payable.date;
    if(depDates.length > 0) relevantDate = moment(relevantDate).isSameOrBefore(depDates[0]) ? depDates[0] : relevantDate;

    return {
      ...payable,
      date: moment(relevantDate).format("MM/DD/YYYY"),
      actions: loading.includes(payable.id) ? <CircularProgress /> : actions(payable),
      rowLink: `../form/edit-expenses?e=${payable.id}&${variables}&tab=${tab}&redirect=/accounting`,
      carLink: `../car/${payable.stock}`,
    }
  });

  rows = rows.filter(data => {
    return !data.isNTO || data.isFunded;
  }).filter(x => defaultFilter(x,term))

  console.log(rows)

  const summary = {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)};

  const tableData = {
    rows: rows.filter(x => !hide.includes(x.id)),
    summary,
    headers: headers,
    title: 'Payables', 
  };

  const updateTerm = (id, value) => {
    if(value === null) value = ""
    setTerm(value);
  }

  const printChecks = async () => {
    await writeChecks(rows);
  }

  const markAsPaid = async () => {
    await markPaid(rows);
  }

  return (
    <Grid container spacing={3}>
      <div style={{width: "100%", margin: 13}}>
        <TextLine
          id="filter"
          label={<b style={{paddingLeft: 7}}>Search Payables</b>}
          removeBox
          placeholder="Enter search term"
          value={term}
          onChange={updateTerm}
        />
      </div>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self"/>
      </Grid>
      <div style={{width: "100%", justifyContent: "center"}}>
        <Button disabled={printDisabled} variant="contained" color="primary" style={{marginTop: '20px'}} onClick={printChecks}>
          Write Checks
        </Button>
        <Button disabled={printDisabled} variant="contained" color="secondary" style={{marginTop: '20px'}} onClick={markAsPaid}>
          Mark as Paid
        </Button>
      </div>
    </Grid>
  );
}


const deleteRow = async (id) => {
  if (window.confirm("Are you sure you want to delete this?")) {
    await firebase.firestore().collection('purchases').doc(id).delete();
    StateManager.updateData();
  }
}

const markDone = async (id) => {
  StateManager.setLoading(true);
  await firebase.firestore().collection('purchases').doc(id).update({isPayable: false, paidDate: moment().format("YYYY/MM/DD")});
  StateManager.updateData();
}

const writeCheck = async (payable) => {
  StateManager.setAlertAndOpen("Making check..", "info");
  StateManager.addToLoading(payable.id);

  const category = prompt('Which Account will this check go to?');
  const checkRequests = [{...payable, purchase_id: payable.id, recipient: payable.vendor, memo: `${category}| ${payable.memo}`}];
  const writeParams = {function: "writeChecks", variables: {checkRequests}};
  const writeResponse = await RequestManager.post(writeParams);

  if(writeResponse.success) {
    StateManager.setAlertAndOpen("Check created!", "success");
    StateManager.addToHide(payable.id);
  }
  else {
    StateManager.setAlertAndOpen("Check not created", "error");
    StateManager.removeFromLoading(payable.id);
  }
}

const actions = (payable) => (
  <>
    <IconButton
      aria-label="add-link"
      color="primary"
      onClick={(e) => {
        e.stopPropagation()
        writeCheck(payable)
        }}
      size="large">
      <Create />
    </IconButton>
    {
      payable.files ? <IconButton
        aria-label="add-link"
        color="secondary"
        onClick={(e) => {
          e.stopPropagation()
          showFile(payable.files[0])
          }}
        size="large">
        <Receipt />
      </IconButton>
      : null
    }
    <IconButton
      aria-label="add-link"
      color="error"
      onClick={(e) => {
        e.stopPropagation()
        deleteRow(payable.id)
        }}
      size="large">
      <Delete />
    </IconButton>
  </>
);

const showFile = async (fileLocation) => {
  let link = document.createElement('a');
  link.href = await firebase.storage().ref(fileLocation).getDownloadURL();
  link.target = "_blank";
  link.click();
}

const defaultFilter = (data = {}, term) => {
  let item = {...data};
  delete item.e
  delete item.rowLink
  delete item.actions
  return Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)
}

const writeChecks = async (payables) => {
  StateManager.setPrint(true);
  StateManager.setAlertAndOpen("Making checks..", "info");
  const ids = payables.map(x => x.id);
  StateManager.addToLoading(ids);


  const payees = [...new Set(payables.map(x => x.vendor.trim().toUpperCase()))];
  let checkRequests = [];
  for(let payee of payees){
    const note = prompt(`Memo for ${payee}'s check?`);
    const category = prompt(`Category for ${payee}'s check?`);
    const memo = `${category}| ${note}`;
    const amount = payables.filter(x => x.vendor.trim().toUpperCase() === payee).reduce((a,c) => a +c.amount, 0);
    const ids = payables.map(x => x.id);
    checkRequests.push({recipient: payee, memo, amount, purchase_id: ids});
  }

  console.log("Requests: ", checkRequests);
  const writeParams = {function: "writeChecks", variables: {checkRequests}};
  const writeResponse = await RequestManager.post(writeParams);

  if(writeResponse.success) {
    StateManager.setAlertAndOpen("Checks created!", "success");
    StateManager.addToHide(ids);
  }
  else {
    StateManager.setAlertAndOpen("Checks not created", "error");
    StateManager.removeFromLoading(ids);
  }
  StateManager.setPrint(false);
}


const markPaid = async (payables) => {
  StateManager.setPrint(true);
  StateManager.setAlertAndOpen("Marking as paid..", "info");
  const ids = payables.map(x => x.id);
  StateManager.addToLoading(ids);

  const method = prompt('What was the payment method?');
  const marks = payables.map(payable =>{
    const id = payable.id;
    const memo =  (method || "ACH") + " - " + (payable.memo || "");
    const paidDate = moment().format("YYYY/MM/DD");
    return firebase.firestore().doc(`purchases/${id}`).update({memo, isPayable: false, paidDate})
  });
  await Promise.all(marks);

  StateManager.setAlertAndOpen("Marks complete!", "success");
  StateManager.addToHide(ids);

  StateManager.setPrint(false);
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}