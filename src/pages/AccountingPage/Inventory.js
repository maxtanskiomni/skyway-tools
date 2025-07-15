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
import { TextField } from '@mui/material';


export default function Inventory(props) {
  const { data = {} } = props;
  const { inventory = [] } = data;
  const [showConsignments, setConsignments] = React.useState("all");
  const [filterText, setFilterText] = React.useState('');
  const toggle = () => {
    let next = "";
    if(showConsignments == "all") next = "inventory"
    else if(showConsignments == "inventory") next = "repairs"
    else if(showConsignments == "repairs") next = "all"
    setConsignments(next);
  }

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

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
    .sort((a,b) => b.order - a.order)
    .filter(row => 
      Object.entries(row).some(([key, value]) => 
        ['year', 'make', 'model', 'trim', 'status', 'sub_status', 'owner'].includes(key) && value != null && value.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );

  const summary = [
    {format: 'usd', label: 'Inventory Value', value: rows.reduce((a,c) => a + (c.value || 0), 0)},
    {format: 'usd', label: 'Skyway Classics Total', value: rows.filter(x => x.owner === 'Skyway Classics').reduce((a,c) => a + (c.value || 0), 0)},
    {format: 'usd', label: "Ron's Classic Cars Total", value: rows.filter(x => x.owner === "Ron's Classic Cars").reduce((a,c) => a + (c.value || 0), 0)},
    {format: 'usd', label: 'Other Consignors', value: rows.filter(x => x.owner && x.owner !== 'Skyway Classics' && x.owner !== "Ron's Classic Cars").reduce((a,c) => a + (c.value || 0), 0)}
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
      {key:'sub_status', label:'Sub Status'}, 
      // {key:'market_price', label:'Average Market Price', format:'usd'},
      {key:'owner', label:'Owner'}, 
      {key:'price', label:'List Price', format:'usd'}, 
      {key:'value', label:'Inventory Value', format:'usd'}, 
    ],
    title: '', 
    sorted: true,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} className="no-print">
        <TextField 
          label="Filter results" 
          variant="outlined" 
          fullWidth 
          margin="normal"
          value={filterText}
          onChange={handleFilterChange}
        />
        <div style={{width: "100%", justifyContent: "center"}}>
          <Button variant="contained" color="primary" style={{marginTop: '20px'}} onClick={toggle}>
            Toggle View
          </Button>
        </div>
      </Grid>
      <Grid item xs={12}>
      <>
        <div>Number of records: {tableData.rows.length}</div>
        <SimpleTable key={filterText} {...tableData} linkLocation="_self" summaryTop/>
      </>
      </Grid>
    </Grid>
  );
}
