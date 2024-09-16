import React from 'react';

import makeStyles from '@mui/styles/makeStyles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';

import Button from '@mui/material/Button';
import { StateManager } from '../utilities/stateManager';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import parse from 'html-react-parser';


export default function ResultsList(props) {
    const classes = useStyles();
    const { results, selected } = props;
    const [open, setOpen] = React.useState(results.length > 0);
    StateManager.openSearch = setOpen;

    React.useEffect(() => {
      function updateResults() {
          const isOpen = results.length > 0;
          setOpen(isOpen)
      }
      updateResults();
  }, [results]);
  
    return (
      <>
        {
          open && 
          <div style={{backgroundColor:"white", paddingLeft:"3%", paddingRight:"3%", display: "flex", justifyContent:"center",}}>
            <List style={{width: "100%", justifyContent: "center"}} >
              {
                results.map((item, i) => {
                  return (
                    <div class={props.capWidth ? classes.itemContainer : classes.itemContainerLarge} style={{backgroundColor: selected == i ? "gray" : "white", maxWidth: props.capWidth ? 300 : null}}>
                      <ListItem key={item.id} dense button onClick={item.action} style={{height: props.forceHeight ? 60 : null, minWidth: 200}}>
                        {
                          props.removeIcon || <ListItemIcon>
                            <img style={{maxWidth: 100, margin: 12}} src={item.thumbnail || deafultImage}/>
                          </ListItemIcon>
                        }
                        <ListItemText class={classes.itemText} id={item.objectID} primary={cleanTags(item.label).map(parse)} />
                        <ListItemSecondaryAction >
                          <NavigateNextIcon color="secondary" edge="end"/>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </div>
                  );
                })
              }
            </List>
          </div>
        }
      </>
    );
  };

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  itemText: {
    color: 'black',
  },
  itemContainer:{
    minWidth: 200,
    width: "100%",
  },
  itemContainerLarge:{
    paddingLeft: "15%",
    paddingRight: "15%",
    minWidth: 200
  }
}));

const deafultImage = 	"https://admin.dealeraccelerate.com/assets/image_processing_low_res-b9fff6cfb5c67f8ba64b79debc32fdf1.png";

const cleanTags = (text) => {
  text = text.replace(/em>/g, "strong>");
  const tags = text.match(/<\D+>/g) || [];
  let parts = text.split(/<\D+>/g);

  tags.forEach((tag, i) => {
    if(i%2 == 0) parts[i+1] = tag+parts[i+1];
    else parts[i] = parts[i]+tag;
  });
  return parts;
};