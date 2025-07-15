import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import { MenuItem } from '@mui/material';
import { StateManager } from '../utilities/stateManager';


export default function SelectLine(props) {
  let {data={}, id="", selections=[]} = props;
  if(typeof data[id] === "object" && data[id] != null) data[id] = data[id].key;
  const defaultValue = data[id] || "";
  const [value, setValue] = React.useState(defaultValue);
  // const initSelections = [{value:"", label:"None"}];
  const initSelections = [];
  if(selections == "states") selections = StateManager.states;
  if(selections == "banks") selections = StateManager.banks;
  if(selections == "sexes") selections = StateManager.sexes;
  const startSelects = selections[0].label === "None" ? selections : [...initSelections, ...selections] 
  const [options, setOptions] = React.useState(startSelects);
  const startCheck = defaultValue !== "";
  const [check, setChecked] = React.useState(startCheck);

  React.useLayoutEffect(() => {
      const newCheck = value || ""
      setChecked(newCheck !== "")
  }, [value]);

  const onChange = (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");

    if(value.indexOf("-") > -1){
      const [key, index] = value.split("-");
      value = StateManager[key][index].data;
      value.key = key+"-"+index;
    } 
    props.updater && props.updater(props.id, value || null);
    // props.updater && props.updater("is_"+props.id, true);
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
      {props.removeCheck || <FormControlLabel control={props.removeBox ? <></> : <Checkbox checked={check} onClick={props.onCheck} />} label={props.label} />}
        <Select
          style={{maxWidth:"30%", width:"50%" }}
          labelId={id}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={props.disabled}
        >
          {options.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
        </Select>
    </div>
  );
}
