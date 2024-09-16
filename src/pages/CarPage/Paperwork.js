import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import SimpleTable from '../../components/SimpleTable';
import makeStyles from '@mui/styles/makeStyles';

import Store from '../../utilities/store.js';

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import Preview from '../../components/Preview.js';

import Button from '@mui/material/Button';

export default function Paperwork() {
  const classes = useStyles();

  const [type, setType] = React.useState("in");
  const [loading, setLoading] = React.useState(false);
  const [tableData, setData] = React.useState({
    rows: [],
    headers: [{key:'date', label:'Date'}, {key:'recipient', label:'Recipient'}, {key:'status', label:'Status'}, {key:'actions', label:'Actions'}],
    title: 'Signature Packages Sent', 
  });


  const onChange = (e) => {
    setType(e.target.value)
  }
  


  return (
    <div style={{width:"100%"}}>
      {/* <Typography variant="p" gutterBottom style={{textAlign: 'left'}}>
        Car Information
      </Typography> */}
      <RadioGroup aria-label="type" name="location" value={type} onChange={onChange}>
        <FormControlLabel value="in" control={<Radio />} label="In-State" />
        <FormControlLabel value="out" control={<Radio />} label="Out-of-State" />
      </RadioGroup>
      <div style={{display: 'flex', width:'100%', justifyContent: 'flex-end'}}>
        <Button variant="contained" color="primary" onClick={() => null}>
          Send To Customer
        </Button>
      </div>

      <div style={{marginTop: '50px'}}>
        {
            loading 
              ? <CircularProgress />
              : <SimpleTable {...tableData} summary={false}/>
          }
        </div>
    </div>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
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
    marginBottom: '10px',
    width: '100%'
  },
}));