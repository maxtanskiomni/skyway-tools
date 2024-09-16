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
import TextsmsIcon from '@mui/icons-material/Textsms';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import firebase from '../utilities/firebase';

import { red, green, blue, yellow, orange, purple, brown } from '@mui/material/colors';
import { StateManager } from '../utilities/stateManager.js';
import moment from 'moment';
import history from '../utilities/history.js';
const colorArray = [red, green, blue, yellow, orange, purple, brown];

export default function LeadCard(props) {
    //Card component
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = () => {
      setExpanded(!expanded);
    };
  
    const hasEmail = !!props.email;
    const hasPhone = !!props.phone_number;

    const incrementContact = async () => { 
      const contacts = firebase.firestore.FieldValue.increment(1);
      const last_contact = moment().format('YYYY/MM/DD HH:mm')
      await firebase.firestore().collection('customers').doc(props.id).update({contacts, last_contact});
    }

    const editLead = () => history.push("../customer/"+props.id);

    const contactPhone = () => {
      console.log("going")
      let link = document.createElement('a');
      link.href = "tel:"+props.phone_number;
      link.click();
      incrementContact();
    }

    const contactSms = () => {
      let link = document.createElement('a');
      link.href = "sms:"+props.phone_number;
      link.click();
      incrementContact();
    }
    
    const contactEmail = () => {
      let link = document.createElement('a');
      link.href = "https://mail.google.com/mail/u/0/?fs=1&tf=cm&source=mailto&to="+props.email+"&su="+props.car+" at Skyway Classics&body=Hi "+props.first_name+",%0A%0A%0A";
      if(StateManager.windowDimensions.width < 800) link.href = "mailto:"+props.email+"?subject="+props.car+" at Skyway Classics&body=Hi "+props.first_name+",%0A%0A%0A";
      link.target = "blank";
      link.click();
      incrementContact();
    }

    const deleteLead = async (id) => {
      if (window.confirm("Are you sure you want to delete this?")) {
        StateManager.setLoading(true);
        await firebase.firestore().collection('customers').doc(props.id).delete();
        window.location.reload();
      }
    }

    const markHot = async () => {
      StateManager.setLoading(true);
      await firebase.firestore().collection('customers').doc(props.id).update({isHot: true});
      window.location.reload();
    }

    const links = {
      car: `../car/${props.stock}`,
    };

    const last_contact = moment(props.last_contact).diff(moment()) > 7 
      ? moment(props.last_contact).format("MM/DD h:mm A") || "None"
      : moment(props.last_contact).format("ddd h:mm A") || "None";
  
    return (
      <Card className={classes.card_root}>
        <CardHeader
          className={classes.cardHeaderContent}
          avatar={
            <Avatar aria-label="recipe" className={classes.avatar} style={{backgroundColor: colorArray[(props.index || 0) % colorArray.length][500]}}>
              {/* {props.title[0].toUpperCase()} */}
              {props.contacts || 0}
            </Avatar>
          }
          title={props.title || ""}
          subheader={"Last: " + (last_contact)}
          action={
            <>
              <IconButton aria-label="edit" onClick={editLead} size="large">
                <EditIcon color="secondary" />
              </IconButton>
              {
                props.isHot
                ? (
                  <IconButton aria-label="delete" onClick={deleteLead} size="large">
                    <DeleteIcon />
                  </IconButton>
                )
                : (
                  <IconButton aria-label="hot" onClick={markHot} size="large">
                    <WhatshotIcon />
                  </IconButton>
                )
              }

            </>
          }
        />
        <CardContent>
          {
            ["stock", "car", "price"].map(id => 
              <Typography class={classes.body_left}>
                {
                  !!links[id] 
                    ?(
                      <a href={links[id] || ""}>
                        {id[0].toUpperCase()+id.substring(1)}: {props[id] || "N/A"}
                      </a>
                    )
                    : (
                      `${id[0].toUpperCase()+id.substring(1)}: ${props[id] || "N/A"}`
                    )
                }
              </Typography>
            )
          }
        </CardContent>
        <CardActions disableSpacing>
          <IconButton
            aria-label="call"
            disabled={!hasPhone}
            onClick={contactPhone}
            size="large">
            <PhoneCallbackIcon color={hasPhone ? "primary" : ""} />
          </IconButton>
          <IconButton aria-label="sms" disabled={!hasPhone} onClick={contactSms} size="large">
            <TextsmsIcon color={hasPhone ? "primary" : ""} />
          </IconButton>
          <IconButton
            aria-label="email"
            disabled={!hasEmail}
            onClick={contactEmail}
            size="large">
            <EmailIcon color={hasEmail ? "secondary" : ""} />
          </IconButton>
          <div style={{display:"flex", flexDirection:"row", justifyContent:"flex-end", width: "100%"}}>
            <Typography 
              paragraph 
              style={{display:"flex", alignItems:"center", marginBottom:0}}
            >
                See Comments
            </Typography>
            <IconButton
              className={clsx(classes.expand_no_padding, {
                [classes.expandOpen]: expanded,
              })}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              size="large">
              <ExpandMoreIcon />
            </IconButton>
          </div>
        </CardActions>
        <Collapse in={expanded} timeout="auto">
          <CardContent>
            <Typography paragraph>
              {props.comments || "No comment"}
            </Typography>
          </CardContent>
        </Collapse>
      </Card>
    );
  };