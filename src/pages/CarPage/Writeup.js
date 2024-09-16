import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import { Grid, IconButton, Paper } from '@mui/material';
import TextField from '@mui/material/TextField';

import { StateManager } from '../../utilities/stateManager.js'

import moment from 'moment';
import { Delete } from '@mui/icons-material';
import RequestManager from '../../utilities/requestManager';

export default function Writeup(props) {
  const classes = useStyles();
  const { car } = props;

  const [newNote, setNewNote] = React.useState('');
  const [oldNotes, setNotes] = React.useState(car.bullets || []);
  const [writeup, setWriteup] = React.useState(car.writeup || []);

  const updater = (e) => {
    const { id, value } = e.target;
    setNewNote(value);
  };

  const addNote = async (note) => {
    note = newNote;
    if(newNote === "") return;
    if(note.includes("\n")) note = note.split("\n");
    else if(note.includes(",")) note = note.split(",");

    const bullets = [...oldNotes, note].flat();
    console.log(bullets)
    setNotes(bullets);
    setNewNote("");
    await firebase.firestore().doc('cars/'+car.stock).update({bullets});
    return;
  }

  const deleteRow = async (note) => {
    console.log(oldNotes, note)
    const bullets = oldNotes.filter(x => x !== note);
    console.log(bullets)
    setNotes(bullets);
    await firebase.firestore().doc('cars/'+car.stock).update({bullets});
  }

  return <>
    <Paper className={classes.paper}>
      <Grid container spacing={3} direction="column" alignItems='center'>
        <Grid item xs={12} sm={6} style={{width: "100%"}}>
          <TextField
            value={newNote}
            onChange={updater}
            id={"feature"} 
            name={"feature"}
            label={"New feature"}
            placeholder="Add feature" 
            multiline={true} 
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button variant="contained" color="primary" onClick={addNote}>
            Add Car Feature
          </Button>
        </Grid>
      </Grid>
      </Paper>

      <h2 style={{textAlign:"left", marginTop: 30}}>Car Features</h2>
      {
        oldNotes.length <= 0 
        ? <h4 style={{textAlign:"left", marginTop: 30}}>None Entered</h4>
        : oldNotes.map(note => {
          return (
            <Paper className={classes.paper}>
              <Grid container spacing={3} alignItems='center'>
                <Grid item xs={2}>
                  <div style={{borderRight:'2px solid black'}}>
                  <IconButton
                    aria-label="add-link"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRow(note)
                      }}
                    size="large">
                    <Delete />
                  </IconButton>
                  </div>
                </Grid>
                <Grid item xs={8} >
                  {note}
                </Grid>
              </Grid>
            </Paper>
          );
        })
      }

      <h2 style={{textAlign:"left", marginTop: 30}}>Writeup</h2>
      <WriteupSection writeup={writeup} stock={car.stock} />
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

const WriteupSection = (props) => {
  const { writeup = "", stock } = props;
  const [text, setText] = React.useState(writeup);

  const onChange = e => {
    const {value} = e.target;
    setText(value);
    const update= {writeup: value, needsDAUpdate: true};
    firebase.firestore().doc("cars/"+stock).set(update, {merge: true});
  }

  const save = () => {
    const update= {writeup: text, needsDAUpdate: true}
    firebase.firestore().doc("cars/"+stock).set(update, {merge: true});
    StateManager.setAlertAndOpen("Writeup Saved!");
  }

  const generate = async () => {
    console.log(`Getting for ${stock}`);
    StateManager.setLoading(true);
    const parameters = {
      function: "generateWriteup",
      variables: {
        stock,
      }
    };
  
    let respsonse = await RequestManager.post(parameters);
    console.log(respsonse);
    setText(respsonse.writeup);
    StateManager.setLoading(false);
    StateManager.setAlertAndOpen("Writeup Saved!");
  }


  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      flexDirection: "column",
      borderBottomWidth: '3px' 
    }}>
      <Button variant="contained" color="primary" onClick={generate}>
        Generate Writeup
      </Button>
      <TextField
        id="write-up"
        label="Vehicle Writeup"
        value={text}
        multiline
        minRows={20}
        margin="normal"
        variant="outlined"
        onInput={onChange}
      />
    </div>
  );
}