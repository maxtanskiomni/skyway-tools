import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';

import Store from '../../utilities/store.js';

import Preview from '../../components/Preview.js';
import Button from '@mui/material/Button';


export default function FileBank(props) {
  const classes = useStyles();

  return (
    <div style={{width:'100%'}}>
      <Preview drop={true} cta={props.cta || 'Upload File'} />
      <div style={{display: 'flex', width:'100%', justifyContent: 'flex-end'}}>
        <Button variant="text" color="primary" onClick={() => null}>
          Request from customer
        </Button>
        <Button variant="contained" color="primary" onClick={() => null}>
          Save Files
        </Button>
      </div>
    </div>
  );
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