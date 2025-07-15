import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import moment from 'moment';


export default function Shipping(props) {
  let { rows, filter = () => true } = props;
  rows = rows.filter(filter).sort((a, b) => moment(a.date).diff(moment(b.date)));

  const binaryIndicator = (isEnabled) => (
    isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
  );

  rows = rows
    .map(x => {
      console.log(x)
      const receivable = x.invoice.total - x.deposits;
      return {
        ...x.car,
        ...x.nto,
        ...x, 
        receivable,
        sold_date: x.date,
        complete: binaryIndicator(x.complete),
        rowLink: `../car/${x.car.stock}?tab=shipping`,
      } 
    })
    .sort(
      function(a, b) { 
        return moment(a.date).diff(b.date);
    });

  const tableData = {
    rows,
    headers: [
      {key:'complete', label:'Shipping Complete'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'sold_date', label:'Sold Date', format:"date"},
      {key:'openServiceCount', label:'Open Service Count'},
      {key:'shipping_date', label:'Ship Date', format:"date"},
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

