import React from 'react';

import useStyles from '../utilities/styles.js';

import SubtaskDialog from './SubtaskDialog.js';
import RepairDialog from './RepairDialog.js';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
// import IconButton from '@mui/material/IconButton';
// import Collapse from '@mui/material/Collapse';


export default function CheckboxList(props) {
    const classes = useStyles();
    const tasks = props.tasks || [];
    const [open, setOpen] = React.useState(false);
    const [data, setData] = React.useState({});
    const [checked, setChecked] = React.useState(tasks.filter(item => {
      if(item.status) return item.id;
      return false;
    }));

    const toggleDialog = () => setOpen(!open);

    const openDialog = selectedData => {
      setData(selectedData);
      toggleDialog();
    };
  
    const toggleCheck = (value) => () => {
      const currentIndex = checked.indexOf(value);
      const newChecked = [...checked];
  
      if (currentIndex === -1) {
        newChecked.push(value);
      } else {
        newChecked.splice(currentIndex, 1);
      }
  
      setChecked(newChecked);
    };
  
    return (
      <>
      <List className={classes.root}>
        {tasks.map(item => item.id).map((value, i) => {
          const labelId = `checkbox-list-label-${value}`;
  
          return (
            <ListItem key={value} role={undefined} dense button onClick={() => openDialog(tasks[i])}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checked.includes(value)}
                  tabIndex={-1}
                  disabled
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={tasks[i].label} />
            </ListItem>
          );
        })}
      </List>
      {
          !!data.subtasks && (
            <SubtaskDialog open={open} onClose={toggleDialog} data={data} />
          )
        }
        {
          props.id === 'repair' && (
            <RepairDialog open={open} onClose={toggleDialog} data={data} />
          )
        }
      </>
    );
  };