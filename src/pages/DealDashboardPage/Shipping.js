import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import moment from 'moment';


export default function Shipping(props) {
  let { rows, filter = () => true } = props;
  rows = rows.filter(filter).sort((a, b) => moment(a.date).diff(moment(b.date)));;

  const binaryIndicator = (isEnabled) => (
    isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
  );

  rows = rows
    .map(x => {
      const receivable = x.invoice.total - x.deposits;
      return {
        ...x.car,
        ...x.nto,
        ...x, 
        receivable,
        date: x.shipping_date || x.shipping_in_date,
        type: x.shipping_date ? "Outbound" : "Inbound",
        complete: binaryIndicator(x.unpaid <= 0 && receivable <= 0),
        rowLink: `../car/${x.car.stock}?tab=shipping`,
      } 
    })
    .sort(
      function(a, b) { 
        return moment(a.date).diff(b.date);
    });

    const summary = [
      {format: 'usd', label: 'Revenue', value: rows.reduce((a,c) => a + c.revenue, 0)},
      {format: 'usd', label: 'COGS', value: rows.reduce((a,c) => a + c.cogs, 0)},
      {format: 'usd', label: 'Gross Margin', value: rows.reduce((a,c) => a + c.profit, 0)},
      {format: 'usd', label: 'Receivables', value: rows.reduce((a,c) => a + c.receivable, 0)},
      {format: 'usd', label: 'Payables', value: rows.reduce((a,c) => a + c.unpaid, 0)},
      {format: 'usd', label: 'Internal Payments', value: rows.reduce((a,c) => a + c.transfer_deposits, 0)},
    ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'complete', label:'Shipping Complete'},
      {key:'date', label:'Ship Date', format:"date"},
      {key:'type', label:'Type'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'revenue', label:'Revenue', format:'usd'},
      {key:'cogs', label:'Cost', format:'usd'}, 
      {key:'receivable', label:'Receivable', format:'usd'}, 
      {key:'unpaid', label:'Payable', format:'usd'}, 
      {key:'profit', label:'Profit', format:'usd'}, 
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

