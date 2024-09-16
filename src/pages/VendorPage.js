import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, AssignmentTurnedIn, Create, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import TextLine from '../components/TextLine';
import firebase from '../utilities/firebase';
import moment from 'moment';
import { StateManager } from '../utilities/stateManager';
import { Button } from '@mui/material';
import history from '../utilities/history';

const headers = [
  {key:'isPaid', label:'Is Paid?', noLink:true}, 
  {key:'date', label:'Date'},
  {key:'car', label:'Car'},
  {key:'memo', label:'Memo'}, 
  {key:'amount', label:'Amount', format:'usd'}, 
  {key:'actions', label:'Actions', noLink:true}
]

export default function VendorPage(props) {
  let { vendor } = props.match.params;
  const unit = new URL(window.location.href).searchParams.get("unit") || "items";
  vendor = vendor.toLowerCase().split("-").map(x => x.charAt(0).toUpperCase() + x.slice(1)).join("-");
  const [term, setTerm] = React.useState("");
  const name = StateManager.formatTitle(vendor);
  const [items, setItems] = React.useState([]);
  StateManager.setTitle(`${name}'s ${unit}`);

  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      let washes = await db.collection('purchases')
                                          .where('vendor', '==', name)
                                          .get();
      washes = washes.docs.map(async x => {
          const wash = x.data();
          let car = await db.doc(`cars/${wash.stock}`).get();
          car = car.data() || false;
          car = car && `${car.stock} ${car.year || ""} ${car.make || ""} ${car.model || ""}`;
          return {...wash, id: x.id, car};
        });
      washes = await Promise.all(washes);
      washes = washes.filter(x =>  x.isPayable); //moment(x.paidDate).diff(moment(), "days") <= 60 ||
      setItems(washes);                   
      StateManager.setLoading(false);
    }
    StateManager.updateData = fetchData
    fetchData();
  }, name );

  let rows = items.map(item => {

    const variables = Object.keys(item)
                            .filter(key => key !== 'e')
                            .map(key => `${key}=${item[key]}`).join("&");

    return {
      ...item,
      isPaid:  BinaryIndicator(!item.isPayable),
      actions: actions(item.id, item.files),
      rowLink: `../input/edit-vendor-item?e=${item.id}&${variables}&redirect=/vendor-items/${vendor}`,
    }
  });

  rows = rows.filter(data => {
    return !data.isNTO || data.isFunded;
  }).filter(x => defaultFilter(x,term))

  // console.log(rows)

  const summary = [
    {format: 'usd', label: 'Unpaid Total', value: rows.reduce((a,c) => a + (c.isPayable ? c.amount : 0), 0)},
    {format: 'usd', label: 'Paid Total', value: rows.reduce((a,c) => a + (c.isPayable ? 0 : c.amount), 0)},
    {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)}
  ];

  const tableData = {
    rows,
    summary,
    headers: headers,
    title: `${name}'s ${unit}`, 
  };

  const updateTerm = (id, value) => {
    if(value === null) value = ""
    setTerm(value);
  }

  const onClick = (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    const redirect = url.pathname;

    const destination = `/input/edit-vendor-item?redirect=${redirect}&vendor=${name}`;
    history.push(destination);
  }

  return (
    <Grid container spacing={3}>
      <div style={{width: "100%", margin: 13}}>
        <TextLine
          id="filter"
          label={<b style={{paddingLeft: 7}}>Search {unit}</b>}
          removeBox
          placeholder="Enter search term"
          value={term}
          onChange={updateTerm}
        />
      </div>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self"/>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={onClick}>
          Add {unit}
        </Button>
      </Grid>
    </Grid>
  );
}

const BinaryIndicator = (isEnabled) => (
  isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
);

const deleteRow = async (id) => {
  if (window.confirm("Are you sure you want to delete this?")) {
    StateManager.setLoading(true);
    await firebase.firestore().collection('purchases').doc(id).delete();
    StateManager.updateData();
  }
}

const markDone = async (id) => {
  StateManager.setLoading(true);
  await firebase.firestore().collection('purchases').doc(id).update({isPayable: false, paidDate: moment().format("YYYY/MM/DD")});
  StateManager.updateData();
}

const actions = (id, files) => (
  <>
    {
      files ? <IconButton
        aria-label="add-link"
        color="secondary"
        onClick={(e) => {
          e.stopPropagation()
          showFile(files[0])
          }}
        size="large">
        <Receipt />
      </IconButton>
      : null
    }
    <IconButton
      aria-label="add-link"
      color="error"
      onClick={(e) => {
        e.stopPropagation()
        deleteRow(id)
        }}
      size="large">
      <Delete />
    </IconButton>
  </>
);

const showFile = async (fileLocation) => {
  let link = document.createElement('a');
  link.href = await firebase.storage().ref(fileLocation).getDownloadURL();
  link.target = "_blank";
  link.click();
}

const defaultFilter = (data = {}, term) => {
  let item = {...data};
  delete item.e
  delete item.rowLink
  delete item.actions
  return Object.values(item).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(term.toLowerCase()), false)
}