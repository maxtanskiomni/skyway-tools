import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';


export default function Leads(props) {
  let { leads = [], filter = () => true } = props;
  for (let i = 0; i < leads.length; i++) {
    leads[i].phone = formatNumber(`${leads[i].phone}`);
  }
  let rows = leads.filter(filter);

  const summary = [
    {label: 'Total', value: rows.reduce((a,c) => a + 1, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'name', label:'Lead Name'}, 
      {key:'phone', label:'Phone Number'}, 
      {key:'email', label:'Email'}, 
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}

const formatNumber = (phoneNumberString) => {
  const cleaned = phoneNumberString.replace(/\D/g, '');
  
  // Format the phone number
  const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  
  // Return the formatted phone number
  return formatted;
}
