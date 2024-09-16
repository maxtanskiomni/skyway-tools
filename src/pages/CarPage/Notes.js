import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import { Grid, Paper } from '@mui/material';
import TextField from '@mui/material/TextField';

import { StateManager } from '../../utilities/stateManager.js'

import moment from 'moment';

export default function Notes(props) {
  const classes = useStyles();
  const { car } = props;

  const [newNote, setNewNote] = React.useState('');
  const [oldNotes, setNotes] = React.useState(car.notes || []);

  const updater = (e) => {
    const { id, value } = e.target;
    const note = {value, timestamp: moment().format("yyyy/MM/DD HH:mm")}
    setNewNote(note);
  };

  const addNote = async (note) => {
    if(newNote === "") return;
    const notes = [...oldNotes, newNote];
    setNotes(notes);
    setNewNote({value: ""});
    await firebase.firestore().doc('cars/'+car.stock).update({notes});
    return;
  }

  return (
    <>
      <Paper className={classes.paper}>
        <Grid container spacing={3} direction="column" alignItems='center'>
          <Grid item xs={12} sm={6} style={{width: "100%"}}>
            <TextField
              value={newNote.value}
              onChange={updater}
              id={"note"} 
              name={"note"}
              label={"New Note"}
              placeholder="Add note" 
              multiline={true} 
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="primary" onClick={addNote}>
              Add Note
            </Button>
          </Grid>
        </Grid>
        </Paper>

        <h2 style={{textAlign:"left", marginTop: 30}}>Notes</h2>
        <Paper className={classes.paper}>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={2}>
              <div style={{borderRight:'2px solid black'}}>
                Timestamp
              </div>
            </Grid>
            <Grid item xs={8} >
              Note
            </Grid>
          </Grid>
        </Paper>
        {
          oldNotes.map(note => {
            return (
              <Paper className={classes.paper}>
                <Grid container spacing={3} alignItems='center'>
                  <Grid item xs={2}>
                    <div style={{borderRight:'2px solid black'}}>
                      {moment(note.timestamp).format("MM/DD/YYYY HH:mm")}
                    </div>
                  </Grid>
                  <Grid item xs={8} >
                    {note.value}
                  </Grid>
                </Grid>
              </Paper>
            )
          })
        }
      </>
  );
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