import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

import IconButton from '@mui/material/IconButton';
import { Delete, Add } from '@mui/icons-material';
import DropdownTable from '../../components/DropdownTable';
import Checkbox from '@mui/material/Checkbox';
import TrackingButton from '../../components/TrackingButton'
import NewNoteButton from '../../components/NewNoteButton';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const defaultTable = {
  headers: [
    {key:'date', label:'Date'},
    {key:'note', label:'Note'}, 
    {key:'delete', label:'Delete', noLink: true}, 
  ],
  title: '', 
}

export default function Repairs(props) {
  const { stockNumber } = props
  const [loading, setLoading] = React.useState(false);
  const [tableData, setData] = React.useState({});
  const [filterValue, setFilter] = React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      //TODO: change from invoices to deals in order to allow for editing invoices and such
      const snap = await db.collection('repairs')
                                .where('stock', '==', stockNumber)
                                .get();

      const promises = snap.docs.map( 
        async (doc, i) => {
          let repair = doc.data();

          const deleteRow = async (id) => {
            setLoading(true)
            await firebase.firestore().collection('notes').doc(id).delete();
            await fetchData();
          }
    
          const buttons = (id) => (
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
          )

          let notes = await db.collection('notes').where('ref_value', '==', doc.id).get();
          notes = notes.docs.map(doc => {
            const data = doc.data();

            return{
              tracking_number: <TrackingButton id={doc.id} expand={data.repair} />, 
              ...data,
              rowLink: null,//`../car/${doc.id}?tab=5`,
              delete: buttons(doc.id),
            }
            
          });

          return {
            ...repair,
            notes,
            id: doc.id,
          }
        }
      );

      const rows =(await Promise.all(promises)).sort((a,b) => a.stock < b.stock ? 1 : -1)

      setLoading(false);
      setData({rows, ...defaultTable});
    }
    fetchData();
  }, []);

  React.useEffect(() => {
  }, [filterValue]);

  const createDropdowns = () => {
    if(!tableData.rows) return null
    const rows = tableData.rows;
    const components = rows.map(repair => {

        const filteredData = {
          tableData: {rows: repair.notes, ...defaultTable},
          label: `${repair.desc}`,//- ${data[0].car}
          value: "",
        }

        const addButton = <NewNoteButton ref_value={repair.id} />

        const clickCheck = checked => {
          return null
        }

        const url = new URL(window.location.href)
        const is_expanded = repair.id == url.searchParams.get("expand")
        return <DropdownTable id={repair.id} {...filteredData} clickCheck={clickCheck} checked={repair.is_complete} action={addButton} expand={is_expanded}  />
    })
    
    return components
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {
          loading 
            ? <CircularProgress />
            : createDropdowns()
        }
      </Grid>
    </Grid>
  );
}

{/* <SimpleTable {...tableData} title={props.title}/> */}
