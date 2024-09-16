import React from 'react';
import Typography from '@mui/material/Typography';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import WarningIcon from '@mui/icons-material/Warning';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { IconButton } from '@mui/material';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';

import useStyles from '../utilities/styles.js';
import clsx from 'clsx';
import { StateManager } from '../utilities/stateManager.js';
import TextLine from './TextLine.js';
import SelectLine from './SelectLine.js';
import DateLine from './DateLine.js';
import ActionLine from './ActionLine.js';
import constants from '../utilities/constants.js';
import DeleteIcon from '@mui/icons-material/Delete.js';


export default function RepairLine(props) {
  const {data={}, id="", updater=()=>null } = props;
  const classes = useStyles();

  const startCheck = data ? !!data[id] : false;
  const [check, setChecked] = React.useState(startCheck);
  const [expanded, setExpanded] = React.useState(false);
  const [status, setStatus] = React.useState(data[id] || "");
  const [comments, setComments] = React.useState(data[id+"-comments"] || "");

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const updateStatus = (stat) => {
    if(stat === status) stat = false;
    setStatus(stat);
    updater("repairs", {[id]: stat});
  }

  const updateComments = (e) => {
    const {value} = e.target;
    setComments(value);
    updater("repairs", {[id+"-comments"]: value});
  }
  
  const onCheck = () => {
    if(!check) updater("repairs", {[id]: false});
    setChecked(!check);
  }

  const deleteRepair = () => {
    StateManager.setAlertAndOpen("Repair deleted!", "success");
  }

  return (
    <div style={{ backgroundColor: 'white', }}>
      <div style={{
        backgroundColor: 'white', 
        padding: '17px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottomWidth: '3px' 
      }}>
        <FormControlLabel control={<Checkbox checked={check} onClick={onCheck} />} label={StateManager.formatTitle(props.label)} />
        <div style={{display: "flex"}}>
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
          <IconButton onClick={deleteRepair} size="large">
            <DeleteIcon />
          </IconButton>
        </div>
      </div>
      <Collapse in={expanded} timeout="auto">
        <div style={{margin: 30}}>
          <SelectLine id={'owner'} label='Task Owner' data={{}} selections={constants.makeSelects("employees")} updater={()=>null} removeBox />
          <TextLine 
            inputProps={{style: { textAlign: 'left'}}}
            id={"assignDate"}
            label={"Date Assigned"}
            multiline
            disabled
            removeBox
            value={comments} 
          />
          <DateLine id={'dueDate'} label={'Due Date'} data={{}} updater={()=>null} drop_is removeBox/>
          <TextLine 
            inputProps={{style: { textAlign: 'left'}}}
            style={{ width:"75%" }}
            id={"comments"}
            label={"Comments"}
            multiline 
            removeBox
            value={comments} 
            onChange={updateComments}
          />
          {/* <ActionLine label="Delete repair" actions={[{icon: "delete", props:{onClick: deleteRepair}}]}/> */}
        </div>
      </Collapse>
    </div>
  );
}
