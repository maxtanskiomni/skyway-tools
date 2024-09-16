import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import useStyles from '../../utilities/styles.js';
import IconButton from '@mui/material/IconButton';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Button from '@mui/material/Button';
import DatePicker from "react-datepicker";


import Preview from '../../components/Preview.js';
import Store from '../../utilities/store.js';
import moment from 'moment';

let formName = 'form';
let addToForm = () => null;
Store.activeFormSetter = {};
const InputForm = (props) => {
  // Store.activeFormSetter = {}; //This is causing errors on the "edit service form" only... Not sure why..  It works everywhere else.  Moved to the global scope to solve
  const { id } = props;
  const [inputs, setInputs] = React.useState(props.inputs || [])
  addToForm = (newItems = [], removeItems = []) => {
    removeItems = removeItems.map(removeItem => removeItem.id)
    let inputsCopy = [...inputs]
    inputsCopy = inputsCopy.filter( item => !removeItems.includes( item.id ) )
    setInputs([...inputsCopy, ...newItems]);
  }
  formName = id;

  React.useEffect(() => {
    setInputs(props.inputs)
  }, [props.inputs]);

  return (
    <React.Fragment>
      <Grid container spacing={3}>
        {
          inputs.map( input =>  
            <>
              {renderFunctions[input.type](input)}
            </>
          )
        }
      </Grid>
    </React.Fragment>
  );
}

export default InputForm


const RenderTextField = (props) => {
  const {id, label, defaultValue, required, disabled, inputType, loadDefault, arrayName, index, visible=true, multiline=false, mask=false, callback=false} = props.input;
  const url = new URL(window.location.href)
  const defaultArrayValue = url.searchParams.get(id.replace("-"+index, ""));
  let initValue = defaultValue || "";
  if(typeof defaultArrayValue == "string"){
    initValue = defaultArrayValue
    if(!!mask) initValue = mask(initValue)
    if(!!callback) callback(id, initValue)
  } 
  const [text, setText] = React.useState(initValue);
  if(initValue && !arrayName) Store[formName][id] = text;
  else if(initValue && !!arrayName) Store.updateArray(formName, arrayName, {index, id, value: text});

  Store.activeFormSetter[id] = value => {
    if(value == '') delete Store[formName][id]
    setText(value);
  }
  
  if(loadDefault) {
    (async () => {
      let defaultValue = await loadDefault( {setter: setText} );
      // console.log(formName, defaultValue)
      // console.log(Store[formName])
      if(arrayName){
        const [key, index] = id.split("-");
        Store[formName][arrayName][index][key] = defaultValue;
      }
      else Store[formName][id] = defaultValue;
    })()
  }

  const onChange = (e) => {
    let {value, name, id} = e.target;
    // console.log("Store", Store[formName]);
    if(props.input.mask) value = props.input.mask(value);
    if(props.input.callback) props.input.callback(name || id,value);
    const isNull = value === null || value == undefined;
    setText(isNull ? "" : value);

    if(arrayName) Store.updateArray(formName, arrayName, {index, id, value});
    else Store.update(formName, {name, id, value});
    
    if(Store.form.updater) Store.form.updater(formName, id || name);
  }

  if(!visible) return <></>

  return (   
    <Grid item xs={12} sm={6}>       
      <TextField
        required={required || false}
        disabled={disabled || false}
        multiline={multiline || false}
        value={text}
        id={id}
        name={id}
        label={label}
        type={inputType}
        onChange={onChange}
        fullWidth
      />
    </Grid>
  )
}

const RenderDateField = (props) => {
  const {id, label, defaultValue, arrayName, index, required} = props.input;

  const [value, setValue] = React.useState(defaultValue || '');
  Store.activeFormSetter[id] = value => {
    if(value == '') delete Store[formName][id]
    setValue(value);
  }
  const classes = useStyles();

  const onChange = (date) => {
    setValue(date);
    const value = moment(date).format("YYYY/MM/DD");
    
    if(arrayName) Store.updateArray(formName, arrayName, {index, id, value});
    else Store.update(formName, {id, value});

    if(Store.form.updater) Store.form.updater(formName, id);
  }

  return (
    <Grid item xs={12} sm={6}>
      <FormControl className={classes.formControl} fullWidth required>
        <DatePicker 
          style={{alignText: 'right', width: '100%'}} 
          onChange={onChange} 
          selected={value}
          customInput={<TextField style={{width: '100%'}} label={label+(required ? " *" : "")}/>}
        />
      </FormControl>
    </Grid>
  )
}

const RenderSelect = (props) => {
  const {id, label, loadDefault, defaultValue, conditionals, arrayName, index, visible = true} = props.input;
  const [selections, setSeletions] = React.useState( !Array.isArray(props.input.selections) ? [] : props.input.selections);
  const [value, setValue] = React.useState("");
  
  React.useEffect(async () => {
    if(typeof props.input.selections === 'function'){
      let updateSelections = await props.input.selections();
      // console.log(updateSelections)
      setSeletions(updateSelections);
    }

    const ifDefault = defaultValue !== null && defaultValue !== undefined;
    if(ifDefault) {
      setValue(`${defaultValue}`.replace("%20", " "));
      let itemsToAdd = [], itemsToRemove = [];
      for (let i = 0; i < conditionals?.length; i++) {
        const condition = conditionals[i];
        if(defaultValue === condition.value) itemsToAdd = [...itemsToAdd, ...condition.inputs];
        else itemsToRemove = [...itemsToRemove, ...condition.inputs];
      }
      console.log(itemsToAdd, itemsToRemove);
      setTimeout(() => addToForm(itemsToAdd, itemsToRemove), 100);
      
    }

    if(!!loadDefault) {
      setTimeout(async () => {
        let default_value = ifDefault ? defaultValue : await loadDefault( {setter: setValue} );

        if(arrayName){
          const [key, index] = id.split("-");
          Store[formName][arrayName][index][key] = default_value;
        }
        else {
          Store.update(formName, {id: id, value: default_value});
          Store[formName][id] = default_value;
        }
        setValue(default_value);

      }, 100);
    }
  }, []);

  Store.activeFormSetter[id] = value => {
    if(value == '') delete Store[formName][id]
    setValue(value);
  }
  const classes = useStyles();

  const onChange = (e) => {
    let {value, name, id} = e.target;
    setValue(value);

    let itemsToAdd = [], itemsToRemove = [];
    for (let i = 0; i < conditionals?.length; i++) {
      const condition = conditionals[i];
      if(value === condition.value) itemsToAdd = [...itemsToAdd, ...condition.inputs];
      else itemsToRemove = [...itemsToRemove, ...condition.inputs];
    }
    
    addToForm(itemsToAdd, itemsToRemove);

    if(arrayName) Store.updateArray(formName, arrayName, {index, id: id || name, value});
    else Store.update(formName, {name, id: id || name, value});

    if(Store.form.updater) Store.form.updater(formName, id || name);
  }

  if(!visible) return <></>

  return (
    <Grid item xs={12} sm={6}>
      <FormControl className={classes.formControl} fullWidth required>
        <InputLabel id={id}>{label}</InputLabel>
        <Select
          labelId={id}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
        >
          {selections.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
        </Select>
      </FormControl>
    </Grid>
  )
}

const RenderArray = (props) => {
  let {id} = props.input;
  const [number, setNumber] = React.useState(1);

  let items = []
  for (let i = 0; i < number; i++) {
    const identifers = {arrayName: id, index:i}
    const newInputs = props.input.items.map( x => ({...x, ...identifers, id: x.id+'-'+i}))
    items = [...items, newInputs]
  }

  return (
    <>
      {
        items.map( (inputs) => 
          inputs.map( input => renderFunctions[input.type](input) )
        )
      }
      <div/>
      <Grid item spacing={0}>
        <Button
          variant="text"
          color="primary"
          onClick={() => setNumber(number+1)}
        >
          Add another item
        </Button> 
      </Grid>
    </>
  )
}

const renderFunctions = {
  text: (input) => <RenderTextField input={input} />,
  date: (input) => <RenderDateField input={input} />,
  select: (input) => <RenderSelect input={input} />,
  array: (input) => <RenderArray input={input} />,
  file: (input) => (
    <Grid item xs={12} sm={6}>
      <Preview formName={formName} />
    </Grid>
  ),
  blank: () => <Grid item xs={12} sm={6}/>
};