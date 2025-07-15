import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const headers = [ 
  {key:'number', label:'Number'},
  {key:'stock', label:'Stock Number'},
  {key:'car', label:'Car'},
  {key:'price', label:'Listing Price', format: "usd"}, 
  // {key:'year', label:'Year'},
  // {key:'make', label:'Make'},
  // {key:'model', label:'Model'},
  {key:'status', label:'Status'},
  {key:'date', label:'Arrival'},
  {key:'status_time', label:'Last Update'},
  // {key:'market_price', label:'Market Price', format: "usd"},
];

export default function CarList(props) {
  const { cust_id } = props;
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] = React.useState({});
  const [filterText, setFilterText] = React.useState('');

  React.useEffect(() => {
    async function fetchTransactions() {
      const db = firebase.firestore();
      let customer = await db.doc("customers/"+cust_id).get();
      customer = customer.exists ? customer.data() : {};
      let queries = [
        {collection: 'deals', doc: "buyer"},
        {collection: 'deals', doc: "cobuyer"},
        {collection: 'cars', doc: "consignor"},
        // {collection: 'cars', doc: "stock", value: customer.stock},
      ];
      queries = queries.map(({collection, doc, value}) => 
        db.collection(collection).where(doc, '==', value || cust_id).get()
      );
      queries = await Promise.all(queries);
      console.log(queries.map(snap => snap.docs))

      const docs = queries.map(snap => snap.docs).flat();
      const promises = docs.map(async doc => {
        const data = doc.data() || {};
        const snap = await db.doc('cars/'+doc.id).get();
        const car = snap.data();

        return {
          id: doc.id, 
          ...data,
          ...car,
          car: `${car.year || ""}${car.year ? " " : ""}${car.make || ""}${car.make ? " " : ""}${car.model || ""}${car.model ? " " : ""}${car.trim || ""}`,
          market_price: car?.pricing?.excellent || "N/A",
          rowLink: `../car/${snap.id}`,
        };
      });

      const rows = await Promise.all(promises);

      setLoading(false);
      setData({
        rows,
        headers,
        title: 'Customer Vehicles', 
      });
    }
    fetchTransactions();
  }, [cust_id]);

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

  const filteredRows = tableData.rows ? tableData.rows.filter(row => 
    row.status != null && row.status.toString().toLowerCase().includes(filterText.toLowerCase())
  ) : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField 
          label="Filter by status" 
          variant="outlined" 
          fullWidth 
          margin="normal"
          value={filterText}
          onChange={handleFilterChange}
        />
      </Grid>
      <Grid item xs={12}>
        {
          loading 
            ? <CircularProgress />
            : (
              <>
                <div>Number of records: {filteredRows.length}</div>
                <SimpleTable key={filterText} {...tableData} rows={filteredRows} linkLocation="_self"/>
              </>
            )
        }
      </Grid>
    </Grid>
  );
}