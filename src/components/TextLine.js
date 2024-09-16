import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';


export default function TextLine(props) {
  const {data={}, id=""} = props;
  const defaultValue = data[id] || "";
  const [text, setText] = React.useState(defaultValue);
  const startCheck = defaultValue !== "";
  const [check, setChecked] = React.useState(startCheck);

  React.useLayoutEffect(() => {
      const newCheck = text || ""
      setChecked(newCheck !== "")
  }, [text]);

  const onChange = (e) => {
    const value = props.type !== "number" ? e.target.value : cleanNumber(e.target.value);
    setText(`${value}` || "");
    
    if(!!props.onChange) return props.onChange(props.id, value || null);

    props.updater && props.updater(props.id, value || null);
    if(!props.drop_is) props.updater && props.updater("is_"+props.id, true);
  }


  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      {props.removeCheck || <FormControlLabel control={props.removeBox ? <></> : <Checkbox checked={props.check || check} onClick={props.onCheck} />} label={props.label} />}
      <TextField
          inputProps={{style: { textAlign: props.alignment || 'center'}}}
          style={{maxWidth: props.maxWidth || "30%", width:"50%"}}
          {...props}
          id={props.idOverride || props.id}
          label={""}
          type={props.type}
          value={props.value || text}
          onChange={onChange}
      />
    </div>
  );
}
