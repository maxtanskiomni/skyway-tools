import React from 'react';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { StateManager } from '../../utilities/stateManager.js'
import moment from 'moment/moment.js';

export default function WorldPacPage(props) {

  const [text, setText] = React.useState();

  const onChange = e => {
    const {value} = e.target;
    setText(value);
  }
  

  const save = () => {
    const parsed = parseTextToObjects(text);
    const SOs = parsed.filter(part => part.account.includes("SO"));
    const inventory = parsed.filter(part => part.account.includes("INV"));
    const exepnses = parsed.filter(part => ![...(SOs.map(x => x.id)), ...(inventory.map(x => x.id))].includes(part.id));
    console.log(SOs, inventory, exepnses);
  }

  function parseTextToObjects(text) {
    const lines = text.split('\n');
    const objects = lines.map(line => {
        const parts = line.split('\t').map(part => part.trim());
        console.log(parts)
        return {
            date: moment(parts[0]).format("YYYY/MM/DD"),
            id: parts[1],
            account: (parts[3] || "").toUpperCase(),
            cost: parseFloat(parts[6]),
            notes: parts[7] || null // Optional
        };
    });
    return objects.filter(obj => obj.date && obj.id); // Filtering out any empty or incorrectly formatted lines
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
      <TextField
        id="write-up"
        label="WorldPac Text"
        multiline
        minRows={20}
        margin="normal"
        variant="outlined"
        onInput={onChange}
      />
      <Button variant="contained" color="primary" onClick={save}>
        Parse Text
      </Button>
    </div>
  );
}