import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import { Grid, Paper } from '@mui/material';
import TextField from '@mui/material/TextField';

import { StateManager } from '../../utilities/stateManager.js'

import moment from 'moment';

export default function Contacts(props) {
  const classes = useStyles();

  const [contacts, setContacts] = React.useState(props.contacts || []);

  React.useEffect(() => {
    async function updateLead(input = {}) {
      await firebase.firestore().doc('leads/'+props.id).update({contacts});
    }
    updateLead();
  }, [contacts]);

  const addContact = async (type) => {
    const newContact = {type, timestamp: moment().format("YYYY/MM/DD HH:mm"), user: StateManager.userName, userID: StateManager.userID};
    setContacts((oldContacts) => [...oldContacts, newContact]);
  }

  return <>
    <Paper className={classes.paper}>
      <Grid container spacing={3} direction="column" alignItems='center'>
        <Grid item xs={12} sm={6}>
          <Button variant="contained" color="primary" onClick={() => addContact("call")} style={{margin: 5}}>
            Record Call
          </Button>
          <Button variant="contained" color="secondary" onClick={() => addContact("text")} style={{margin: 5}}>
            Record Text
          </Button>
          <Button
            variant="contained"
            onClick={() => addContact("email")}
            style={{margin: 5}}>
            Record Email
          </Button>
        </Grid>
      </Grid>
      </Paper>

      <h2 style={{textAlign:"left", marginTop: 30}}>Contacts</h2>
      <Paper className={classes.paper}>
        <Grid container spacing={3} alignItems='center'>
          <Grid item xs={2}>
            <div style={{borderRight:'2px solid black'}}>
              Timestamp
            </div>
          </Grid>
          <Grid item xs={8} >
            Contact
          </Grid>
        </Grid>
      </Paper>
      {
        contacts.map(contact => {
          return (
            <Paper className={classes.paper}>
              <Grid container spacing={3} alignItems='center'>
                <Grid item xs={2}>
                  <div style={{borderRight:'2px solid black'}}>
                    {moment(contact.timestamp).format("MM/DD/YYYY HH:mm")}
                  </div>
                </Grid>
                <Grid item xs={8} >
                  {`${contact.type.toProperCase()}ed`}{contact.user ? ` - ${contact.user}` : ""}
                </Grid>
              </Grid>
            </Paper>
          )
        })
      }
    </>;
}

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    marginBottom: '10px'
  },
}));