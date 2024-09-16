import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

import IconButton from '@mui/material/IconButton';
import { Delete, DoneAll } from '@mui/icons-material';
import DropdownTable from '../../components/DropdownTable';
import Checkbox from '@mui/material/Checkbox';
import TrackingButton from '../../components/TrackingButton';
import NewRepairButton from '../../components/NewRepairButton';
import NewNoteButton from '../../components/NewNoteButton';
import { StateManager } from '../../utilities/stateManager';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

// const defaultTable = {
//   headers: [
//     {key:'check', label:'', noLink: true},
//     {key:'date', label:'Start Date'},
//     {key:'desc', label:'Description'}, 
//     {key:'parts_not_ordered', label:'Parts Not Ordered'},
//     {key:'actions', label:'Actions', noLink: true}, 
//   ],
//   title: '', 
// }

const defaultTable = {
  headers: [
    {key:'date', label:'Start Date'},
    {key:'tracking_number', label:'Tracking Number', noLink: true},
    {key:'is_recieved', label:'Recieved', noLink: true},
    {key:'check', label:'Complete', noLink: true},
    // {key:'vendor', label:'Vendor'},
    {key:'desc', label:'Description'}, 
    {key:'actions', label:'Delete', noLink: true}, 
  ],
  title: '', 
}

export default function Repairs(props) {
  const [tableData, setData] = React.useState({});
  const [filterValue, setFilter] = React.useState({});


  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      //TODO: change from invoices to deals in order to allow for editing invoices and such
      const snap = await db.collection('repairs')
                                .where('status', '==', 'active')
                                .get();

      const promises = snap.docs.map( 
        async (doc, i) => {
          let repair = doc.data();
          
          const parts = await db.collection('parts').where('repair', '==', doc.id).get();
          repair.parts = parts.docs.map(x => x.data());
          repair.parts_needed = repair.parts?.length || 0
          repair.parts_ordered = repair.parts?.filter(y => y.is_ordered).length || 0
          repair.parts_not_ordered =  repair.is_complete ? 0 : repair.parts_needed - repair.parts_ordered
          repair.parts_not_ordered = repair.parts_not_ordered > 0 ? `${repair.parts_not_ordered}/${repair.parts_needed}` : 0;

          const snap = await db.doc('cars/'+repair.stock).get();
          const car = snap.exists ? snap.data() : {};

          const deleteRow = async (id) => {
            StateManager.setLoading(true);
            await firebase.firestore().collection('repairs').doc(id).delete();
            await fetchData();
          }
    
          const buttons = (id) => (
            <>
              <NewNoteButton ref_value={id} color="secondary"/>
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

          const CustomCheckbox = (props) => {
            const {id, doc_key} = props;
            const [checked, setCheck] = React.useState(props[doc_key]);
            const markDone = async () => {
              setCheck(!checked)
              await firebase.firestore().collection('repairs').doc(id).update({[doc_key]: !checked});
            }
            return <Checkbox checked={checked} onClick={markDone}/>
          }

          return {
            ...car,
            ...repair,
            car: snap.exists ? `${car.year || ""} ${car.model || ""}` : "Car data not entered",
            id: doc.id, 
            rowLink: `../car/${car.stock}?tab=repairs&expand=${doc.id}`,
            actions: buttons(doc.id),
            tracking_number: <TrackingButton id={doc.id} expand={doc.stock} />,
            is_recieved: <CustomCheckbox id={doc.id} doc_key="is_recieved" {...repair} />,
            check: <CustomCheckbox id={doc.id} doc_key="is_complete" {...repair} />,
          }
        }
      );

      const rows =(await Promise.all(promises)).sort((a,b) => a.stock < b.stock ? 1 : -1)

      StateManager.setLoading(false);
      setData({rows, ...defaultTable});
    }
    fetchData();
  }, []);

  React.useEffect(() => {
  }, [filterValue]);

  const createDropdowns = () => {
    if(!tableData.rows) return null;

    const rows = tableData.rows;
    const stockNumbers = [...new Set(rows.map(x => x.stock))].sort((a,b) => a.stock < b.stock ? 1 : -1)

    const components = stockNumbers.map(stock => {
        let data = rows.filter(x => x.stock == stock)
        const all_complete = data.filter(x => !x.is_complete).length < 1;
        const parts_needed = data.filter(x => !x.is_complete).reduce((a,c) => a + c.parts_not_ordered, 0);
        const repairs_left = data.filter(x => !x.is_complete).length;
        const repairs_total = data.length;

        const filteredData = {
          tableData: {rows: data, ...defaultTable},
          label: `${stock}- ${data[0].car}`,
          value: parts_needed > 0 ? "Parts needed!" : `${repairs_total - repairs_left}/${repairs_total}` + " complete",
        }

        const clickCheck = checked => {
          const status = checked ? "complete" : "active";
          data.forEach(repair => {
            firebase.firestore().doc(`repairs/${repair.id}`).set({status, is_complete: checked}, {merge: true});
          });
        }

        const addButton = <NewRepairButton stock={stock} />

        const url = new URL(window.location.href)
        const is_expanded = stock== url.searchParams.get("expand")
        return <DropdownTable id={stock} {...filteredData} clickCheck={clickCheck} checked={all_complete} action={addButton} expand={is_expanded}  />
    })
    
    return components;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          {
            StateManager.loading 
              ? null
              : createDropdowns()
          }
      </Grid>
    </Grid>
  );
}

{/* <SimpleTable {...tableData} title={props.title}/> */}
