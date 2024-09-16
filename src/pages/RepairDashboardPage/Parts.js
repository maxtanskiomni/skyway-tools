import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import moment from 'moment';

import IconButton from '@mui/material/IconButton';
import { Delete, DoneAll, Add } from '@mui/icons-material';
import Checkbox from '@mui/material/Checkbox';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Parts(props) {
  const [loading, setLoading] = React.useState(false);
  const [tableData, setData] = React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      //TODO: change from invoices to deals in order to allow for editing invoices and such
      const snap = await db.collection('parts')
                                .where('is_recieved', '==', false)
                                .get();

      const promises = snap.docs.map( 
        async (doc, i) => {
          const part = doc.data();

          const repair_snap = await db.doc('repairs/'+part.repair).get();
          const repair = repair_snap.exists ? repair_snap.data() : {};
          
          const car_snap = await db.doc('cars/'+repair.stock).get();
          const car = car_snap.exists ? car_snap.data() : {};

          const deleteRow = async (id) => {
            setLoading(true)
            await firebase.firestore().collection('parts').doc(id).delete();
            await fetchData();
          }

          const markDone = async (id) => {
            setLoading(true)
            await firebase.firestore().collection('parts').doc(id).update({ is_recieved: true });
            await fetchData();
          }
    
          const buttons = (id) => (
            <>
              <IconButton
                aria-label="add-link"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteRow(id)
                  }}
                size="large">
                <Delete />
              </IconButton>
            </>
          )

          const url = new URL(window.location.href)
          const redirect = url.pathname
          const trackingURL = `/form/add-tracking?redirect=${redirect}&tab=parts&expand=${doc.id}&p=`;
          const addTracking = (id) => history.push(trackingURL + id);
          const toggleItem = (id, key, value) => firebase.firestore().doc(`parts/${id}`).set({[key]: value}, {merge: true});
          
          const CustomCheckbox = (props) => {
            const {id, doc_key} = props;
            const [checked, setCheck] = React.useState(props[props.doc_key]);
            const onClick = (e) =>{
              setCheck(e.target.checked)
              toggleItem(id, doc_key, e.target.checked)
            }
            return <Checkbox checked={checked} onClick={onClick}/>
          }

          const trackingButton = (id) => (
            <IconButton
              aria-label="add-link"
              color="primary"
              onClick={() => addTracking(id)}
              size="large">
              <Add />
            </IconButton>
          )

          return {
            ...repair,
            ...car,
            ...part,
            arrival: moment(part.arrival).format("MM/DD/YYYY"),
            car: car_snap.exists ? `${car.year} ${car.model}` : "Car data not entered",
            id: doc.id, 
            rowLink: null,//`../car/${doc.id}?tab=5`,
            actions: buttons(doc.id),
            tracking_number: trackingButton(doc.id),
            is_recieved: <CustomCheckbox id={doc.id} doc_key={"is_recieved"} {...part} />,
          }
        }
      );

      const rows =(await Promise.all(promises)).sort((a,b) => a.stock < b.stock ? 1 : -1)

      setLoading(false);
      setData({
        rows,
        headers: [
          {key:'is_recieved', label:'Recieved', noLink: true},
          {key:'date', label:'Request Date'},
          {key:'stock', label:'Stock Number'},
          {key:'car', label:'Car'}, 
          {key:'vendor', label:'Vendor'}, 
          {key:'desc', label:'Description'}, 
          {key:'tracking_number', label:'Tracking', noLink: true},
          {key:'actions', label:'Actions'}, 
        ],
        title: '', 
      });
    }
    fetchData();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          {
            loading 
              ? <CircularProgress />
              : <SimpleTable {...tableData} title={props.title}/>
          }
      </Grid>
    </Grid>
  );
}
