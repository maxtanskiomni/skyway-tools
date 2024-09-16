import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Titles(props) {
  const [loading, setLoading] = React.useState(false);
  const [tableData, setData] =React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      //TODO: change from invoices to deals in order to allow for editing invoices and such
      const dealSnap = await db.collection('cars')
                                .where('status', '==', 'active')
                                .where(props.field, '==',props.value)
                                .get();

      const promises = dealSnap.docs.map( 
        async (doc, i) => {
          const car = doc.data();

          return {
            ...car,
            car: `${car.year || ''} ${car.model || ''}`,
            id: doc.id, 
            stock: doc.id, 
            rowLink: `../car/${doc.id}?tab=5`,
            rowAction: null,//() => history.push()
          }
        }
      );

      const rows = await Promise.all(promises)

      setLoading(false);
      setData({
        rows,
        headers: [
          {key:'number', label:'Number'},
          {key:'stock', label:'Stock Number'}, 
          {key:'year', label:'Year'}, 
          {key:'make', label:'Make'}, 
          {key:'model', label:'Model'}, 
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
