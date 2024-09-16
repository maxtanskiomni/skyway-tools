import React from 'react';
import Typography from '@mui/material/Typography';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';


export default function Check(props) {
  const startCheck = props.data ? props.data[props.id] : false;
  const [check, setChecked] = React.useState(startCheck);
  
  const onCheck = () => {
    props.updater && props.updater(props.id, !check);
    setChecked(!check);
  }

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<Checkbox checked={check} onClick={onCheck} />} label={props.label} />
      <Typography variant='body1' style={{display: 'flex', alignItems: "center"}}>
        {props.value || ''}
      </Typography>
    </div>
  );
}
