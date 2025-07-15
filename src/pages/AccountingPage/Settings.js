import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import RequestManager from '../../utilities/requestManager.js';
import firebase from '../../utilities/firebase.js';
import moment from 'moment';
import { StateManager } from '../../utilities/stateManager.js';
import { TextField } from '@mui/material';


export default function Settings(props) {
  const {data = {}} = props;
  const { summary = {}} = data;
  
  const textInputIds = [
    'mercuryBalance', 
    'wellsFargoBalance', 
    'seacoastBalance',
    'pilotBalance',
    'clearingBalance',
    "seacoastLOCBalance",
    "prepaidAssets",
  ];

  let initValues = {};
  for(const bank of textInputIds){
    initValues[bank] = summary[bank];
  }
  const [values, setValues] = React.useState(initValues);

  const handleInputChange = async (event) => {
    let { value } = event.target;

    value = +(value.replace(/,/g,""));
    if(isNaN(value)) return false;
    const update = {[event.target.id]: value, lastAccountingUpdate: moment().format("MM/DD/YYYY hh:mm A")};
    setValues({...values, ...update});
    await firebase.firestore().doc("admin/counters").update(update);
  };

  return (
    <Paper>
      {
        StateManager.pageLoading ||
        <div>
          <Typography variant="h6" color="inherit" noWrap>
            Settings:
          </Typography>

          <div style={{marginTop:10, marginBottom:10, display:'flex', flexDirection: "column"}}>
            {
              textInputIds.map((id) => (
                <TextField
                  key={id}
                  id={id}
                  label={id}
                  style={{width: "35%"}}
                  value={values[id] || ''}
                  onChange={handleInputChange}
                  onBlur={StateManager.reload}
                  margin="normal"
                  variant="outlined"
                />
              ))
            }
          </div>
        </div>
      }
    </Paper>
  );
}