import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import LeadCard from '../../components/LeadCard';
import { StateManager } from '../../utilities/stateManager';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Leads(props) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState([]);


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      //TODO: change from invoices to deals in order to allow for editing invoices and such
      const snap = await db.collection('customers')
                                .where('contacts', '<=', 6)
                                .get();

      const promises = snap.docs.map( 
        async (doc, i) => {
          const customer = doc.data();

          let car = await db.doc("cars/"+customer.stock).get();
          car = car.data();

          return {
            ...customer,
            name: customer.first_name + " " + customer.last_name,
            car: `${car.year || ""} ${car.make || ""} ${car.model || ""}`,
            price: "$"+(car.listPrice || "").toLocaleString(undefined, {minimumFractionDigits: 2}),
            id: doc.id, 
            rowLink: null,//`../car/${doc.id}?tab=5`,
          }
        }
      );

      let rows = await Promise.all(promises);
      rows = rows.filter(x => x.isHot == props.isHot);
      // rows = row.sort((a,b) => )

      setData(rows);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <Grid container spacing={3} direction="row" justifyContent='center' >
          {
            loading 
              ? <CircularProgress />
              : data.map((lead, i) => 
                  <Grid item xs={StateManager.windowDimensions.width < 800 ? 12: 4}>
                    <LeadCard key={i} index={i} {...lead} title={lead.name}/>
                  </Grid>
                )
          }
      
    </Grid>
  );
}
