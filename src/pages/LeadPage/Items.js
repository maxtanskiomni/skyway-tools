import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select } from '@mui/material';
import moment from 'moment';


const headers = [
  {key:'toggle', label:'Complete'}, 
  {key:'due_date', label:'Due Date'},
  {key:'activity', label:'Type'}, 
  {key:'methods', label:'Methods'}, 
];

export default function Items(props) {
  const { tasks = defaultTasks, id} = props;
  const [currentTasks, setTasks] = React.useState(tasks);

  const rows = currentTasks.map((task, i) => {
    const item = {...task, isComplete: !!task.isComplete}
    return makeObject(item, {currentTasks, setTasks, id, i});
  });


  const tableData = {
    rows,
    headers: headers,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self"/>
      </Grid>
    </Grid>
  );
}


const makeObject = (item, params = {}) => {

  return {
    ...item,
    toggle:  ToggleIndicator(item.isComplete, params),
    due_date: moment(item.date).add(item.day, "days").format("MM/DD/YYYY")
  }
}



const ToggleIndicator = (isEnabled, params) => {

  const toggleChecked = async (e) => {
    e.stopPropagation();

    const newTasks = params.currentTasks.map((x,i) => {
      if(i === params.i) x.isComplete = !isEnabled 
      return x
    });
    params.setTasks([...newTasks]);
    const lastContact = newTasks.reduce((a,c) => a || c.isComplete, false) ? moment().format("YYYY/MM/DD") : "";
    await firebase.firestore().collection("leads").doc(params.id).update({tasks: newTasks, lastContact});
  }

  return (
    <IconButton aria-label="add-link" color="error" onClick={toggleChecked} size="large">
      {isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}


const defaultTasks = [
  { day: 0, activity: "Initial contact", methods: "All provided"},
  { day: 0, activity: "End of day follow-up", methods: "All provided"},
  { day: 1, activity: "Two day follow-up", methods: "All provided"},
  { day: 3, activity: "Incentive offer - $500 store credit", methods: "All provided"},
  { day: 5, activity: "Pictures/Video followup",  methods: "SMS and email" },
  { day: 7, activity: "Phone call attempt", methods: "SMS and email" },
  { day: 10, activity: "Written follow-up to phone call", methods: "SMS and email"},
  { day: 15, activity: "Incentive offer - $1000 store credit", methods: "All provided"},
  { day: 22, activity: "'Are you giving up on this' message", methods: "SMS and email"},
  { day: 30, activity: "Final follow-up", methods: "All provided"},
];