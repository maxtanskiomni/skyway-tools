import React from 'react';

import useStyles from '../utilities/styles.js';

import CheckboxList from './CheckboxList.js';

import clsx from 'clsx';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import CommentIcon from '@mui/icons-material/Comment';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


export default function MyCollapseList(props) {
    const list = props.list;
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = () => {
      setExpanded(!expanded);
    };
  
    return (
      <List className={classes.root}>
        <ListItem key={list.id} role={undefined} dense button onClick={handleExpandClick}>
          <ListItemText id={list.id} primary={list.label} />
          <ListItemSecondaryAction>
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: expanded,
              })}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              edge="end"
              size="large">
              <ExpandMoreIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        <Collapse in={expanded} timeout="auto">
          <CheckboxList id={list.id} tasks={list.tasks} />
        </Collapse>
      </List>
    );
  }