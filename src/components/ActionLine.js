import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import TextField from '@mui/material/TextField';

import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import TextsmsIcon from '@mui/icons-material/Textsms';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { StateManager } from '../utilities/stateManager';

const buttons = {
  favorite: (props) => <FavoriteIcon {...props}/>,
  share: (props) => <ShareIcon {...props}/>,
  email: (props) => <EmailIcon {...props}/>,
  edit: (props) => <EditIcon {...props}/>,
  text: (props) => <TextsmsIcon {...props}/>,
  phone: (props) => <PhoneCallbackIcon {...props}/>,
  delete: (props) => <DeleteIcon {...props}/>,
  expand: (props) => <ExpandMoreIcon {...props}/>,
  vert: (props) => <MoreVertIcon {...props}/>,
};


export default function ActionLine(props) {
  const { actions = [] } = props;
  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<></>} label={StateManager.formatTitle(props.label)} />
      <div>
        {
          actions.map(action => {
            return (
              <IconButton size="large">
                {buttons[action.icon](action.props)}
              </IconButton>
            );
          })
        }
      </div>
    </div>
  );
}
