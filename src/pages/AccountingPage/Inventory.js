import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import moment from 'moment';
import { StateManager } from "../../utilities/stateManager";


export default function Inventory(props) {
  const { data = {} } = props;
  const { inventory = [] } = data;
  const [showConsignments, setConsignments] = React.useState("all");
  const toggle = () => {
    let next = "";
    if(showConsignments == "all") next = "inventory"
    else if(showConsignments == "inventory") next = "repairs"
    else if(showConsignments == "repairs") next = "all"
    setConsignments(next);
  }

  let rows = inventory.map(car => {
    return {
      ...car,
      car: `${car.year || ''} ${car.make || ''} ${car.model || ''}`,
      id: car.id, 
      stock: car.id, 
      order: +car.id.replace(/-.+/, ""),
      rowLink: `../car/${car.id}`,
    };
  }).filter(x => showConsignments === "all" ? x.value > 0 : showConsignments === "inventory" ? x.value >= 5000 : (x.value <5000 && x.value > 0))
    .sort((a,b) => b.order - a.order);

  const summary = [
    {format: 'usd', label: 'Inventory Value', value: rows.reduce((a,c) => a + (c.value || 0), 0)},
    {format: 'usd', label: 'Value > 5k', value: rows.filter(x=> x.value > 5000).reduce((a,c) => a + (c.value || 0), 0)},
    {format: 'usd', label: 'Value <= 5k', value: rows.filter(x=> x.value <= 5000).reduce((a,c) => a + (c.value || 0), 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      {key:'number', label:'Number'},
      {key:'date', label:'Date'}, 
      {key:'stock', label:'Stock Number'}, 
      {key:'car', label:'Car'},
      {key:'status', label:'Status'}, 
      {key:'market_price', label:'Average Market Price', format:'usd'},
      {key:'price', label:'List Price', format:'usd'}, 
      {key:'value', label:'Inventory Value', format:'usd'}, 
    ],
    title: '', 
    sorted: true,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
      <div style={{width: "100%", justifyContent: "center"}}>
        <Button variant="contained" color="primary" style={{marginTop: '20px'}} onClick={toggle}>
          Toggle View
        </Button>
      </div>
    </Grid>
  );
}
