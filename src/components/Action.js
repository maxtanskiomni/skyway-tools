import React from 'react';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';


export default function Action(props) {

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormLabel style={{textAlign: 'left', display:"flex", alignItems:'center', color:"#000"}} >{props.label}</FormLabel>
      <div>
        {
          !!props.secondary && 
          <Button variant="contained" color="secondary" onClick={props.secondary.action}>
            {props.secondary.label}
          </Button>
        }
        {
          !!props.primary && 
          <Button variant="contained" color="primary" onClick={props.primary.action}>
            {props.primary.label}
          </Button>
        }
      </div>
    </div>
  );
}
