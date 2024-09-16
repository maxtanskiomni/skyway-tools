import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';
import moment from 'moment';


export default function Consignments(props) {
  let { rows } = props;
  rows = rows.filter(x => !!x.car.consign_rep).map(x => ({
    ...x, 
    contract_start: x.car.contract_start, 
    consign_rep: x.car.consign_rep,
    inventory_days: moment(x.date).diff(x.car.contract_start, "days"),
  }))

  const reps = [...new Set(rows.map(car => car.consign_rep || "Unassigned"))];
  const summary = reps.map( rep => {
    return {
        label: rep, 
        value: rows.filter(car => (car.consign_rep || "Unassigned") === rep).length,
    };
  });

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Car'},
      {key:'contract_start', label:'Start Date'},
      {key:'inventory_days', label:'Inventory Days'},
      {key:'consign_rep', label:'Consignment Rep'}, 
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

