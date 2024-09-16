import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import InputForm from './InputForm';
import Store, { parseSearchString } from '../../utilities/store.js';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { StateManager } from '../../utilities/stateManager';

let lastForm = {}
const InputPage = (props) => {
  const { formName = props.page } = props.match.params;
  const urlParams = parseSearchString(props.location.search);
  const loadNextForm = lastForm.formName !== formName || Object.keys(urlParams).length > 0;
  const form = loadNextForm ? Store.generateForm(formName, urlParams) : lastForm.form;
  lastForm = {formName, form}
  const classes = useStyles();
  let title =  formName.split("-").map(x=>x[0].toUpperCase() + x.substring(1)).join(" ");
  StateManager.setTitle(title);

  const handleNext = async () => {
    //Upload to firbase
    StateManager.setLoading(true);
    const response = await form.action(form.collection, Store[formName]);
    StateManager.setLoading(false);
    if(response.complete){
      StateManager.setAlertAndOpen('Data posted successfully!', 'success')
      Store.clearForm();
      if(form.onSuccess) form.onSuccess(urlParams);
    } 
    else {
      StateManager.setAlertAndOpen('There was an error...', 'error')
    }
  };

  return (
    <div className={classes.layout}>
      <Paper className={classes.paper}>
        <Typography component="h1" variant="h4" align="center">
          {form.title || 'Add Data'}
        </Typography>
        <React.Fragment>
        <InputForm id={formName} inputs={form.inputs} conditionals={form.conditionals} />
        <div className={classes.buttons}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            className={classes.button}
          >
            Submit
          </Button>
        </div>
        </React.Fragment>
      </Paper>
    </div>
  );
}

export default InputPage;


const useStyles = makeStyles((theme) => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
}));