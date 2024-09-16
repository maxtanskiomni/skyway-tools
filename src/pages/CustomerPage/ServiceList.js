import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const headers = [
  {key:'number', label:'Number'},
  {key:'date', label:'Date'},
  {key:'car', label:'Car'}, 
  {key:'status', label:'Status'}, 
  // {key:'cost', label:'Cost', format:"usd"}, 
  {key:'revenue', label:'Revenue', format:"usd"}, 
];

export default function CarList(props) {
  const { cust_id } = props;
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] = React.useState({});

  React.useEffect(() => {
    async function fetchTransactions() {
      const db = firebase.firestore();
      const snap = await db.collection('orders').where('customer', '==', cust_id).get();
      let orders = snap.docs.map(getDocData);

      const servicePromises = orders.map(order => db.collection('services').where('order', '==', order.id).get());
      const servicesSnaps = await Promise.all(servicePromises);
      const services = servicesSnaps.map(servicesSnap => servicesSnap.docs.map(getDocData) ).flat();
      orders.forEach((order, i) => {
        const filteredServices = services.filter(x => x.order === order.id);
        orders[i].services = filteredServices;
        // orders[i].revenue = filteredServices.reduce((a,c) => a + c.revenue || 0, 0);
        orders[i].cost = filteredServices.reduce((a,c) => a + c.cost || 0, 0);
        orders[i].rowLink = `../service-order/${order.id}`;
      });

      const rows = orders;

      const summary = [
        {label: 'Revenue', value: rows.reduce((a,c) => a + c.revenue, 0), format:"usd"},
        // {label: 'Cost', value: rows.reduce((a,c) => a + c.cost, 0), format:"usd"},
        // {label: 'Profit', value: rows.reduce((a,c) => a + (c.revenue - c.cost), 0), format:"usd"},
      ];

      setLoading(false);
      setData({
        rows,
        summary,
        headers,
        title: 'Service Orders', 
      });
    }
    fetchTransactions();
  }, [cust_id]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          {
            loading 
              ? <CircularProgress />
              : <SimpleTable {...tableData} linkLocation="_self"/>
          }
      </Grid>
    </Grid>
  );
}

const getDocData = doc => {
  return {id: doc.id, ...doc.data()}
}
