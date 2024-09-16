import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import { MenuItem } from '@mui/material';

export default function Outstandings(props) {
  const { data = {} } = props;
  const { outstanding_checks = [] } = data;
  const [showRon, setRon] = React.useState(false);
  const toggleRon = () => setRon(!showRon);

  const editCash = (entry) => {
    const tab = new URL(window.location.href).searchParams.get("tab");
    const userID = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if(userID !=="Ppg7VM83fVTugAj1tVifKa8amtF2") return;
    return `/form/edit-check?redirect=accounting&tab=${tab}&id=${entry.id}&memo=${entry.memo}&amount=${entry.amount}&date=${entry.date}&status=${entry.status}&recipient=${entry.recipient}&force_vis=${!!entry.force_vis}`
  }

  const rows = outstanding_checks.map(check => {
    const stock = (check?.memo || "").match(/\d+-FL/g)
    return {
      ...check,
      actions: deleteButton(check.id),
      bank_selector: SelectBank(check),
      rowLink: editCash(check),
      // rowLink: stock && `../car/${stock}`,
    }
  })
  .filter(x => x.force_vis || showRon || !x.recipient.toLowerCase().includes("ron's classic"));

  const summary = [
    {format: 'usd', label: 'Mercury', value: rows.filter(x => x.bank === "mercury").reduce((a,c) => a + c.amount, 0)},
    {format: 'usd', label: 'Pilot', value: rows.filter(x => x.bank === "pilot").reduce((a,c) => a + c.amount, 0)},
    {format: 'usd', label: 'Seacoast', value: rows.filter(x => x.bank === "seacoast").reduce((a,c) => a + c.amount, 0)},
    {format: 'usd', label: 'Wells Fargo', value: rows.filter(x => x.bank === "wells-fargo").reduce((a,c) => a + c.amount, 0)},
    {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)}
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'id', label:'Check Number'}, 
      {key:'date', label:'Date'}, 
      {key:'recipient', label:'Recipient'}, 
      {key:'memo', label:'Memo'}, 
      {key:'bank_selector', label:'Bank'}, 
      {key:'amount', label:'Amount', format:'usd'}, 
      {key:'actions', label:'Actions', noLink:true}
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
      <div style={{width: "100%", justifyContent: "center"}}>
        <Button variant="contained" color="primary" style={{marginTop: '20px'}} onClick={toggleRon}>
          Toggle Ron Checks
        </Button>
      </div>
    </Grid>
  );
}

const dismissCheck = async (id) => {
  StateManager.setLoading(true);
  await firebase.firestore().collection('checks').doc(id).update({status: 'cleared'});
  StateManager.updateData();
  StateManager.setLoading(false)
}

const deleteButton = (id) => (
  <Button variant="contained" color="primary" onClick={async (e) => {
    e.stopPropagation();
    dismissCheck(id)
    }}>
    Dismiss
  </Button>
);


const SelectBank = (check) => {
  const {id} = check;
  const [value, setValue] = React.useState(check.bank || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    await firebase.firestore().collection('checks').doc(id).update({bank: value});
  }

  return (
    <Select
      labelId={id}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
    >
      {StateManager.deposit_banks.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
}
