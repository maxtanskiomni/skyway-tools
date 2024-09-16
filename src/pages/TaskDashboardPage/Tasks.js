import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';

const headers = {
  pending: [
    // {key:'complete_indicator', label:'Completed'},
    {key:'start_date', label:'Assigned'},
    {key:'stock', label:'Stock Number'},
    {key:'type', label:'Type'},
    {key:'memo', label:'Task'}, 
    {key:'actions', label:'Actions', noLink: true},
  ],
  complete: [
    // {key:'complete_indicator', label:'Completed'},
    {key:'start_date', label:'Start Date'},
    {key:'end_date', label:'Completion Date'},
    {key:'stock', label:'Stock Number'},
    {key:'type', label:'Type'},
    {key:'memo', label:'Task'}, 
  ]
}

export default function Tasks(props) {
  let { rows, filter = () => null, type="pending" } = props;
  rows = rows.filter(filter);

  const summary = [
    {label: 'Total', value: rows.length},
  ];

  const tableData = {
    rows,
    summary,
    headers: headers[type],
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
