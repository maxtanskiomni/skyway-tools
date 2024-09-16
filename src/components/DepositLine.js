import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import {cleanNumber} from '../utilities/store.js';
import { Typography } from '@mui/material';
import moment from 'moment';


export default function DepositLine(props) {

  const fields = [
    "date",
    "stock",
    "memo",
    "amount"
  ];

  return (
    <>
      <div style={{
        backgroundColor: 'white', 
        padding: '17px',
        marginBottom: '3px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        // borderBottom: '2px solid black',
      }}>

        {
          fields.map(field => 
            <div style={{minWidth: 100, maxWidth: 300}}>
              <Typography>
                {props[field]}
              </Typography>
            </div>
          )
        }
      </div>
    </>
  );
}
