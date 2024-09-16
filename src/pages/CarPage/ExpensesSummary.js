import React from 'react';
import Typography from '@mui/material/Typography';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';


export default function ExpensesSummary(props) {
  const { expenses = [] } = props;
  const total = expenses.reduce((a,c) => a + c.amount, 0);
  const [show, setShow] = React.useState(true);

  const toggleShow = () => setShow(!show);

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<Checkbox checked={show} onClick={toggleShow} />} label={'Expenses'} />
      <Typography variant='body1' style={{display: !show ? "none" :'flex', alignItems: "center"}}>
        ${(total).toLocaleString(undefined, {minimumFractionDigits:2})}
      </Typography>
    </div>
  );
}
