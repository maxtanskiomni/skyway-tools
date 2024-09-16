import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';


export default function Deals(props) {
  let { rows } = props;

  const binaryIndicator = (isEnabled) => (
    isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
  );

  rows = rows
    .map(x => {
      return {
        title_received: "Not Done",
        title_taken: "Not Done",
        title_sent: "Not Done",
        ...x.car, 
        ...x.nto,
        ...x, 
        complete: binaryIndicator(x.car.title_complete),
        ntoPaid: binaryIndicator(!x.nto.isPayable),
      } 
    })
    .sort(
      function(a, b) { 
        a = (!a.isPayable ? 1 : 0) + (a.title_complete ? 2 : 0);
        b = (!b.isPayable ? 1 : 0) + (b.title_complete ? 2 : 0);
        return a - b;
    });
  
    console.log(rows.filter(x => !x.title_complete));

  const summary = [
    {label: 'Total Complete', value: rows.reduce((a,c) => a + (c.car.title_complete ? 1 : 0), 0)},
    {label: 'Total Outstanding', value: rows.reduce((a,c) => a +  (c.car.title_complete ? 0 : 1), 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'complete', label:'Process Complete'},
      {key:'ntoPaid', label:'NTO Paid'},
      // {key:'number', label:'Deal Number'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'date', label:'Sale Date', format:"date"},
      {key:'title_received', label:'Date Recieved', format:"date"},
      {key:'title_taken', label:'Date Sent to State', format:"date"}, 
      {key:'title_sent', label:'Date Sent to Customer', format:"date"}, 
    ],
    title: '', 
    sorted: true,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}

