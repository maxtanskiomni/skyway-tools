import React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import Container from '@mui/material/Container';
import { Paper } from '@mui/material';
import firebase from '../utilities/firebase';
import { StateManager } from '../utilities/stateManager';
import history from '../utilities/history';


export default function SignUp() {
  const classes = useStyles();
  const [form, setForm] = React.useState({});

  const onChange = (e) => {
    const {value, name, id} = e.target;
    let newForm = {...form, [id || name] : value};
    setForm(newForm);
  }

  const submitForm = async () => {
    const { email, password, firstName, lastName } = form;
    if(!email || !password || !firstName || !lastName) return StateManager.setAlertAndOpen("Please complete form", "error");

    // const isInDomain = email.toLowerCase().endsWith("skywayclassics.com");
    // if(!isInDomain) return StateManager.setAlertAndOpen("You must use your Skyway Classics email to register for this application", "error");

    // const isAuthedUser = StateManager.authed_emails.includes(email);
    // if(!isAuthedUser) return StateManager.setAlertAndOpen("You must be an authorized employee to register for this application", "error");

    StateManager.setLoading(true);
    try{
      const userRecord = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await firebase.auth().signOut();
      delete form.password;
      await firebase.firestore().doc(`users/${userRecord.user.uid}`).set(form);

      StateManager.setAlertAndOpen("Account Created!", "success");
      setTimeout(() => history.push("/"), 500);
    } 
    catch(e) {
      StateManager.setAlertAndOpen(e.message, "error");
    }

    StateManager.setLoading(false);
  }

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Paper className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="firstName"
                variant="outlined"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                onChange={onChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="lname"
                onChange={onChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                onChange={onChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={onChange}
              />
            </Grid>
          </Grid>
          <Button
            // type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={submitForm}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="#" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://skywayclassics.com/">
        Skyway Classics
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 30,
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));