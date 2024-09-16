import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';
import firebase from '../../utilities/firebase';

import { StateManager } from '../../utilities/stateManager';
import algolia from '../../utilities/algolia';
import { MenuItem, Select } from '@mui/material';
import DatePicker from "react-datepicker";
import InputLabel from '@mui/material/InputLabel';
import moment from 'moment';
import NewFileLine from '../../components/NewFileLine.js';

export default function CustomerSummary(props) {
  const { cust_id } = props;
  const classes = useStyles();
  const [loading, setLoading] = React.useState(true);
  const [cust, setCust] = React.useState({});

  const onChange = async (e) => {
    console.log(e)
    const data = {[e.target.id || e.target.name]: e.target.value};
    await firebase.firestore().collection('customers').doc(cust_id).set(data, {merge:true});
    let new_cust = {...cust}
    new_cust = Object.assign(new_cust, data);
    setCust(new_cust);

    algolia.updateRecord("customers", {objectID: cust_id, ...data});
  }
  
  const data = [
    {id: 'first_name', type: "text"},
    {id: 'last_name', type: "text"},
    {id: "email", type: "text"},
    {id: 'phone_number', type: "text"},
    {id: "comments", type: "text", multiline:true},
    {id: 'address1', type: "text"},
    {id: 'city', type: "text"},
    {id: 'state', type: "select", selections: StateManager.states},
    {id: 'zip', type: "text"},
    {id: "birthday", type: "date"},
    {id: "sex", type: "select", selections: StateManager.sexes},
    {id: "dl", type: "text"},
    {id: "license", type: "file"},
    {id: "insurance", type: "file"},
    {id: "routing_number", type: "text"},
    {id: "account_number", type: "text"},
    {id: "notes", type: "text", multiline: true},
  ];

  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const doc = await db.doc('customers/'+cust_id).get();
      if(doc.exists) setCust({id: doc.id, ...doc.data()});
      StateManager.setTitle(`${(doc.data().first_name || "")} ${(doc.data().last_name || "")}`);

      setLoading(false);
    }
    fetchData();
  }, [cust_id]);

  return (
    <Paper className={classes.paper}>
      <div style={{
        display: 'flex', 
        flexDirection: StateManager.windowDimensions.width > 700 || "column-reverse"}}
      >
        <Grid container spacing={3} style={{position: 'relative'}}>
          { 
            loading 
            ? <CircularProgress />
            : data.map(item => (
              <>
                <Grid item xs={12} sm={6}>
                  { renderInput(item, cust, onChange) }
                </Grid>
                <Grid item xs={12} sm={6}></Grid>
              </>
            ))
          }
        </Grid>
      </div>
    </Paper>
  );
}

function renderInput(input, data, updater){
  const {type, id, selections = []} = input;

  if(type == "text"){
    return (
      <TextField
        defaultValue={data[id] || ''}
        multiline={input.multiline || false}
        onBlur={updater}
        id={id}
        name={id}
        label={formatTitle(id)}
        fullWidth
      />
    )
  }

  if(type == "select"){
    return (
      <>
        <InputLabel id={id} style={{textAlign: "left"}}>{formatTitle(id)}</InputLabel>
        <Select
          style={{width: '100%', textAlign: "left"}}
          labelId={id}
          id={id}
          name={id}
          value={data[id]}
          onChange={updater}
          selections={selections}
        >
          {selections.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
        </Select>
      </>
    )
  }

  if(type == "file"){
    return (
      <NewFileLine id={id} label={formatTitle(id)} allowable="imageLike" folder="customer_data" saveLocation={`customers/${data.id}`} data={data} removeCheck />
    )
  }

  if(type == "date"){
    const onChange = date =>{
      const e = {
        target: { id, value :moment(date).format("YYYY/MM/DD") }
      }
      updater(e);
    }
    return (
      <DatePicker 
        style={{alignText: 'right', width: '100%'}} 
        onChange={onChange} 
        selected={Date.parse(data[id])}
        customInput={<TextField style={{width: '100%'}} label={formatTitle(id)}/>}
      />
    )
  }
}

const formatTitle = raw => {
  raw = raw.split('_');
  raw = raw.join(' ');
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