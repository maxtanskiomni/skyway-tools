import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

export default function Checks(props) {
  const { stockNumber } = props;
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] =React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const transactionSnapshot = await db.collection('checks').where('assigned', '==', false).get();

      const dismissCheck = async (id) => {
        setLoading(true)
        await firebase.firestore().collection('checks').doc(id).update({assigned: true});
        await fetchData()
      }

      const deleteButton = (id) => (
        <Button variant="contained" color="primary" onClick={async (e) => {
          e.stopPropagation();
          dismissCheck(id)
          }}>
          Dismiss
        </Button>
      )

      const promises = transactionSnapshot.docs.map( 
        async doc => {
          const url = new URL(window.location.href);
          const tab = url.searchParams.get("tab");
          return {
            id: doc.id, 
            ...doc.data(),
            actions: deleteButton(doc.id),
            rowAction: () => history.push(`/form/assign-checks?check=${doc.id}&memo=${doc.data().memo}&amount=${doc.data().amount}&tab=${tab}`)
          }
        }
      );

      const rows = await Promise.all(promises)
      const summary = {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)};

      setLoading(false);
      setData({
        rows,
        summary,
        headers: [{key:'id', label:'Check Number'}, {key:'date', label:'Date'}, {key:'recipient', label:'Recipient'}, {key:'memo', label:'Memo'}, {key:'amount', label:'Amount', format:'usd'}, {key:'actions', label:'Actions'}],
        title: '', 
      });
    }
    fetchData();
  }, [stockNumber]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          {
            loading 
              ? <CircularProgress />
              : <SimpleTable {...tableData}/>
          }
      </Grid>
    </Grid>
  );
}
