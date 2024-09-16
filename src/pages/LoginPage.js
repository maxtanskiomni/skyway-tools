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
import { StateManager } from '../utilities/stateManager';
import firebase from '../utilities/firebase';
import history from '../utilities/history';

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
    textAlign: "left",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function SignIn() {
  const classes = useStyles();

  const [form, setForm] = React.useState({});
  const [remember, setRemeber] = React.useState(true);

  const onChange = (e) => {
    const {value, name, id} = e.target;
    let newForm = {...form, [id || name] : value};
    setForm(newForm);
  }

  const submitForm = async () => {
    const { email, password } = form;
    if(!email || !password ) return StateManager.setAlertAndOpen("Please complete form", "error");

    StateManager.setLoading(true);
    try{
      // if(remember) await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      
      const userRecord = await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log(userRecord.user.uid)
      let user = await firebase.firestore().doc(`users/${userRecord.user.uid}`).get();
      console.log("user loaded")
      user = user.data();

      if(remember){
        localStorage.setItem('authed', true);
        localStorage.setItem('userID', userRecord.user.uid);
        localStorage.setItem('whiteList', JSON.stringify(user.whiteList || []));
        localStorage.setItem('userType', user.userType || "sales");
      }
      else{
        sessionStorage.setItem('authed', true);
        sessionStorage.setItem('userID', userRecord.user.uid);
        sessionStorage.setItem('whiteList', JSON.stringify(user.whiteList || []));
        sessionStorage.setItem('userType', user.userType || "sales");
      }

      StateManager.setAlertAndOpen("Login Successful!", "success");
      setTimeout(() => history.go(0), 500);
    } 
    catch(e) {
      console.log(e)
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
          Sign in
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={onChange}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={onChange}
          />
          <FormControlLabel
            control={<Checkbox defaultChecked value={remember} onClick={() => setRemeber(!remember)} color="primary" />}
            label="Remember me"
          />
          <Button
            // type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={submitForm}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="/new-user" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Box mt={8}>
        <Copyright />
      </Box>
    </Container>
  );
}