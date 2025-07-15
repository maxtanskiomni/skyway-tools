import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import moment from 'moment/moment';


export default function SoldCars(props) {
  let { rows } = props;
  rows = rows.sort((a, b) => moment(a.date).diff(moment(b.date)));

  const tableData = {
    rows,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'sales_rep', label:'Sales Rep'},
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
