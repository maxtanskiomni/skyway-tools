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
import constants from '../../utilities/constants';


export default function Inventory(props) {
  const { data = {} } = props;
  const { orders = [] } = data;

  let rows = orders
    .sort(
      function(a, b) { 
        a = constants.indexOf(a.title_status)
        b = constants.indexOf(a.title_status)
        return a - b;
    });

  const summary = [
    {label: 'Total Working', value: rows.reduce((a,c) => a + 1, 0)},
  ];

  const tableData = {
    rows,
    summary,
    headers: [
      // {key:'number', label:'Number'},
      {key:'date', label:'Date'},
      {key:'car', label:'Car'},
      {key:'status', label:'Status'}
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
