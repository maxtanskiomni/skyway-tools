import React from 'react';

import useStyles from '../utilities/styles.js';

import CollapseList from './CollapseList.js';

import clsx from 'clsx';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import PostAddIcon from '@mui/icons-material/PostAdd';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import TextsmsIcon from '@mui/icons-material/Textsms';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import LocalCarWashIcon from '@mui/icons-material/LocalCarWash';
import PageviewIcon from '@mui/icons-material/Pageview';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import firebase from '../utilities/firebase';

import { red, green, blue, yellow, orange, purple, brown } from '@mui/material/colors';
import { StateManager } from '../utilities/stateManager.js';
import moment from 'moment';
import history from '../utilities/history.js';
const colorArray = [red, green, blue, orange, purple, brown];

export default function CarCard(props) {
  console.log(props);
  const time = props[(props.type || "status")+"_time"];
    //Card component
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const goTo = () => history.push("../car/"+props.stock);

  const addNote = () => history.push("../car/"+props.stock+"?tab=notes");

  const order = async (type) => {
    const data = {[`order_${type}`]: true};
    await firebase.firestore().collection('cars').doc(props.stock).set(data, {merge:true});
    StateManager.setAlertAndOpen(`${props.stock} - ${type} ordered`, 'success');
  };

  const status_date = time ? moment(time).format("MM/DD/YYYY") : "N/A";
  const age = Math.ceil(moment().diff(status_date, 'days'));
  const start_date = props.date ? moment(props.date).format("MM/DD/YYYY") : "2022/08/30";
  const total_age = Math.ceil(moment().diff(start_date, 'days'));

  let title = props.title || "";
  title = title.length <= 26 ? title : title.substr(0, 24)+"..." 

  return (
    <Card className={classes.card_small_root}>
      <CardHeader
        className={classes.cardHeaderContent}
        style={{padding: 8}}
        avatar={
          <a href={"../car/"+props.stock}>
            <Avatar src={props.thumbnail} aria-label="recipe" style={{
              backgroundColor: props.color || "primary",
              width: 64,
              height: 64,
              marginLeft: 10
            }}>
              <DriveEtaIcon fontSize="large" />
            </Avatar>
          </a>
        }
        title={title}
        subheader={
          <>
            <div>{`${props.type === "status" ? "Working" : "Main"} Status: ${props[props.type === "status" ? "sub_status" : "status"]} \n`}</div>
            <div>{`Status time: ${age} \n`}</div>
            <>{`Total time: ${total_age}`}</>
          </>
          
        }
        action={
          <>
            <IconButton aria-label="go-to" onClick={addNote} size="large">
              <PostAddIcon color="primary" />
            </IconButton>
          </>
        }
      />
    </Card>
  );
};