import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import { Grid, Paper } from '@mui/material';
import TextField from '@mui/material/TextField';

import { StateManager } from '../../utilities/stateManager.js'

import moment from 'moment';

export default function Times(props) {
  const classes = useStyles();
  const { data } = props;

  const [type, setType] = React.useState(null);
  const [times, setTimes] = React.useState(data.times || []);

  React.useEffect(() => {
    const lastTime = times.at(-1) || {};
    const newType = (lastTime.start && !lastTime.end) ? "end" : "start"
    setType(newType);
  }, [times]);

  const addTime = async () => {
    let timesCopy = [...times];
    let newTime = {[type]: moment().format("yyyy/MM/DD HH:mm")};
    if(type === "end") {
      newTime = {...times.at(-1), ...newTime};
      timesCopy = timesCopy.slice(0,-1);
    }
    const newTimes = [...timesCopy, newTime];
    setTimes(newTimes);
    await firebase.firestore().doc('services/'+data.id).update({times: newTimes});
    return;
  }

  return (
    <>
      <Paper className={classes.paper}>
        <Grid container spacing={3} direction="column" alignItems='center'>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="primary" onClick={addTime}>
              Add {type} Time
            </Button>
          </Grid>
        </Grid>
        </Paper>

        <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end"}}>
          <h2 style={{textAlign:"left", marginTop: 30}}>Times</h2>
          <h4 style={{textAlign:"left", marginTop: 30}}>{times.reduce((a,c) => a + (getDuration(c, 0)), 0)} hours</h4>
        </div>
        <Paper className={classes.paper}>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={3}>
              <div style={{borderRight:'2px solid black'}}>
                Start
              </div>
            </Grid>
            <Grid item xs={3} >
              <div style={{borderRight:'2px solid black'}}>
                End
              </div>
            </Grid>
            <Grid item xs={3} >
              Total
            </Grid>
          </Grid>
        </Paper>
        {
          times.map(time => {
            return (
              <Paper className={classes.paper}>
                <Grid container spacing={3} alignItems='center'>
                  <Grid item xs={3}>
                    <div style={{borderRight:'2px solid black'}}>
                      {moment(time.start).format("MM/DD/YYYY HH:mm")}
                    </div>
                  </Grid>
                  <Grid item xs={3}>
                    <div style={{borderRight:'2px solid black'}}>
                      {time.end ? moment(time.end).format("MM/DD/YYYY HH:mm") : ""}
                    </div>
                  </Grid>
                  <Grid item xs={3} >
                    {getDuration(time)}
                  </Grid>
                </Grid>
              </Paper>
            )
          })
        }
        <Grid container spacing={3} direction="column" alignItems='center'>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="primary" onClick={addTime}>
              Add {type} Time
            </Button>
          </Grid>
        </Grid>
      </>
  );
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

let getDuration = (time, d = "") => {
  return time.end ? moment(time.start).diff(time.end, 'hours', true) : d
}