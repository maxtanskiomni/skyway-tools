import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';


export default function Finance(props) {
  let { rows, filter = () => true } = props;
  rows = rows.filter(filter);

  const binaryIndicator = (isEnabled) => (
    isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
  );

  rows = rows
    .map(x => {
      console.log(x)
      const receivable = x.invoice.total - x.deposits;
      return {
        app_sent_customer: "Not Done",
        app_received: "Not Done",
        app_sent_underwriting: "Not Done",
        docs_sent: "Not Done",
        docs_signed: "Not Done",
        ...x.car,
        ...x.nto,
        ...x.invoice,
        ...x, 
        receivable,
        approved: binaryIndicator(x.approved),
        banks: (x.banks || []).map(x => x.label).filter(Boolean).join(", "),
        stipsComplete:  binaryIndicator((x.stips || []).reduce((a,c) => a && c.check, (x.stips || []).length > 0)),
        fundingStipsComplete:  binaryIndicator((x.funding_stips || []).reduce((a,c) => a && c.check, (x.funding_stips || []).length > 0)),
        complete: binaryIndicator(x.car.finance_complete && receivable <= 0),
        carTitleLink: `../car/${x.car.stock}?tab=finance`,
      } 
    })
    .sort(
      function(a, b) { 
        a = (!a.finance_complete ? 1 : 0);
        b = (!b.finance_complete ? 1 : 0);
        return a - b;
    });

  const summary = [
    {label: 'Revenue', value: rows.reduce((a,c) => a + (c.total || 0), 0), format: 'usd', },
    {label: 'Amount Owed', value: rows.reduce((a,c) => a + (c.receivable || 0), 0), format: 'usd', },
    {label: 'Total Complete', value: rows.reduce((a,c) => a + (c.car.finance_complete ? 1 : 0), 0)},
    {label: 'Total Outstanding', value: rows.reduce((a,c) => a +  (c.car.finance_complete ? 0 : 1), 0)},
    {format: 'usd', label: 'Internal Payments', value: rows.reduce((a,c) => a + c.transfer_deposits, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      // {key:'complete', label:'Process Complete'},
      // {key:'number', label:'Deal Number'},
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'}, 
      {key:'date', label:'Sale Date', format:"date"},
      {key:'app_sent_customer', label:'App Sent to Customer', format:"date"},
      {key:'banks', label:'Banks'}, 
      {key:'approved', label:'Approved'}, 
      {key:'stipsComplete', label:'Stips Sent'}, 
      // {key:'docs_sent', label:'Loan Docs Sent for Signature', format:"date"},
      // {key:'docs_signed', label:'Loan Docs Signed', format:"date"},
      {key:'fundingStipsComplete', label:'Funding Stips Sent'},  
      {key:'total', label:'Revenue', format:'usd'},
      {key:'receivable', label:'Amount Owed', format:'usd'}, 
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

