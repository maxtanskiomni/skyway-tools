import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from "../../utilities/stateManager";

const headers = [
  {key:'submodel', label:'Submodel'},
  {key:'specs', label:'Specs'},
  {key:'concours', label:'Concours', format:'usd'}, 
  {key:'excellent', label:'Excellent', format:'usd'}, 
  {key:'good', label:'Good', format:'usd'},
  {key:'fair', label:'Fair', format:'usd'}, 
  // {key:'most_recent_sale', label:'Most Recent Sale', format:'usd'}, 
];


export default function Pricing(props) {
  const { stockNumber } = props;
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] =React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const doc = await db.doc('cars/'+stockNumber).get();
      const data = doc.data();

      const rows = data.pricing.map(variant => {
        return {
          ...variant,
          rowLink: variant.link,
        }
      })

      setLoading(false);
      setData({
        rows,
        headers,
        title: '', 
      });
      StateManager.setLoading(false);
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
