import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';
import { Button, IconButton } from '@mui/material';
import { CheckBox, Delete } from '@mui/icons-material';
import Typography from '@mui/material/Typography';
import firebase from '../utilities/firebase';


export default function NoteLine(props) {
  const {data={}, id, property="items", table = "cars", entity} = props;
  const [newNote, setNewNote] = React.useState('');
  const [oldNotes, setNotes] = React.useState(data[property] || []);
  const [check, setChecked] = React.useState(oldNotes.length > 0);

  React.useLayoutEffect(() => {
      setChecked(oldNotes.length > 0)
  }, [oldNotes]);

  const updater = (e) => {
    const { id, value } = e.target;
    setNewNote(value);
  };

  const addNote = async (note) => {
    if(newNote === "") return;
    if(newNote.includes("\n")) note = newNote.split("\n");
    else if(newNote.includes(",")) note = newNote.split(",");
    else note = [newNote];

    note = note.map( x=> ({label: x, check: false}));

    const bullets = [...oldNotes, note].flat();
    console.log(bullets)
    setNotes(bullets);
    setNewNote("");
    if(!!id) await firebase.firestore().doc(`${table}/${id}`).update({[property]: bullets});
    return;
  }

  const toggleCheck = async (note) => {
    console.log(note)
    const bullets = oldNotes.map(x => {
      if(x.label === note.label) x.check = !x.check;
      return {...x}
    })
    console.log(bullets)
    setNotes(bullets);
    if(!!id) await firebase.firestore().doc(`${table}/${id}`).update({[property]: bullets});
  }

  const deleteRow = async (note) => {
    console.log(oldNotes, note)
    const bullets = oldNotes.filter(x => x.label !== note.label);
    console.log(bullets)
    setNotes(bullets);
    if(!!id) await firebase.firestore().doc(`${table}/${id}`).update({[property]: bullets});
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
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
        {props.removeCheck || <FormControlLabel control={props.removeBox ? <></> : <Checkbox checked={props.check || check} onClick={props.onCheck} />} label={props.label} />}
        <TextField
          inputProps={{style: { textAlign: props.alignment || 'center'}}}
          style={{maxWidth: props.maxWidth || "30%", width:"50%"}}
          {...props}
          value={newNote}
          onChange={updater}
          name={"feature"}
          label={`New ${entity}`}
          placeholder={`Add ${entity}`}
          multiline={true} 
          fullWidth
        />
        <div style={{maxHeight: '40px', display:'flex', flexDirection:'row'}}>
          <Button variant="contained" color="primary" onClick={addNote}>
            Add {entity}
          </Button>
        </div>
      </div>
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', borderBottomWidth: '3px', flexDirection: "column", }}>
        {
          oldNotes.length <= 0 
          ? <h4 style={{textAlign:"left", marginTop: 30}}>None Entered</h4>
          : oldNotes.map(note => {
            return (
              <div style={{padding: '17px', width: '100%', display: 'flex', justifyContent: "space-between",}}>
                <FormControlLabel control={<Checkbox checked={note.check} onClick={() => toggleCheck(note)} />} label={note.label} />
                <div style={{borderLeft:'2px solid black'}}>
                  <IconButton
                    aria-label="add-link"
                    color="error"
                    onClick={(e) => deleteRow(note)}
                    size="large">
                    <Delete />
                  </IconButton>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}




{/* <div style={{width: '100%', display: 'flex', padding: '17px',  justifyContent: 'space-between',borderBottomWidth: '3px' }}>
<FormControlLabel control={<CheckBox checked={() => deleteRow(note)} />} label={note} />
  
  <div style={{borderRight:'2px solid black'}}>
    <IconButton aria-label="add-link" color="error" onClick={(e) => {
      e.stopPropagation()
      deleteRow(note)
      }}
    >
      <Delete />
    </IconButton>
  </div>
  <Typography variant='body1' style={{display: 'flex', alignItems: "center"}}>
    {"Sent" || ''}
  </Typography>
  </div> */}