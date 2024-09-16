import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select } from '@mui/material';
import moment from 'moment';
import DateSelector from '../../components/DateSelector';


const headers = {
  parts: [
    {key:'statusSelector', label:'Status', noLink:true}, 
    {key:'name', label:'Item'},
    {key:'vendor', label:'Vendor'}, 
    // {key:'partNumber', label:'Part Number'}, 
    {key:'arrival_date', label:'Est Arrival', noLink:true}, 
    {key:'href', label:'Link', noLink:true}, 
    {key:'location', label:'Location'}, 
    {key:'cost', label:'Estimated Cost', format:'usd'}, 
    // {key:'revenue', label:'Revenue', format:'usd'}, 
    {key:'actions', label:'', noLink:true}
  ],
  services: [ 
    {key:'isComplete', label:'Complete', noLink:true}, 
    {key:'name', label:'Service'}, 
    // {key:'status', label:'Status'}, 
    {key:'mechanicName', label:'Mechanic'},
    {key:'time', label:'Hours'}, 
    {key:'cost', label:'Cost', format:'usd'},
    // {key:'revenue', label:'Revenue', format:'usd'}, 
    {key:'actions', label:'Actions', noLink:true}
  ],
  subcontracts: [ 
    {key:'isComplete', label:'Complete', noLink:true}, 
    {key:'name', label:'Service'}, 
    {key:'provider', label:'Provider'},
    {key:'cost', label:'Cost', format:'usd'},
    {key:'revenue', label:'Revenue', format:'usd'}, 
    {key:'actions', label:'Actions', noLink:true}
  ],
  expenses: [ 
    {key:'isComplete', label:'Is Paid', noLink:true}, 
    {key:'date', label:'Date'}, 
    {key:'vendor', label:'Vendor'}, 
    {key:'memo', label:'Memo'}, 
    {key:'amount', label:'Cost', format:'usd'},
    {key:'actions', label:'', noLink:true}
  ]
};

const tables = {
  parts: "parts",
  services: "services",
  subcontracts: "subcontracts",
  expenses: "purchases",
};

const summaries = {
  parts: (t) => [
    {format: 'usd', label: 'Total Estimated Cost', value: t.reduce((a,c) => a +( c.cost || 0), 0)},
  ],
  services: (t) =>  [
    {label: 'Total Hours', value: t.reduce((a,c) => a + c.time || 0, 0)},
    {format: 'usd', label: 'Total Cost', value: t.reduce((a,c) => a + (c.cost || 0), 0)},
  ],
  subcontracts: (t) =>  [
    {format: 'usd', label: 'Revenue', value: t.reduce((a,c) => a + (c.revenue || 0), 0)},
    {format: 'usd', label: 'Cost', value: t.reduce((a,c) => a + (c.cost || 0), 0)},
    {format: 'usd', label: 'Profit', value: t.reduce((a,c) => a + (c.profit || 0), 0)}
  ],
  expenses: (t) =>  [
    {format: 'usd', label: 'Total', value: t.reduce((a,c) => a + (c.amount || 0), 0)},
  ],
}

const isComplete = (item) => {
  return item.status === constants.service_statuses.at(-1);
};

const defaultSort = (a, b) => {

  if (isComplete(a) === isComplete(b)) {
    return moment(a.status_time).unix() - moment(b.status_time).unix();
  }

  return isComplete(a) ? 1 : -1;
}

const sorter = {
  parts: defaultSort,
  services: defaultSort,
  subcontracts: defaultSort,
  expenses: defaultSort,
}

const check = (x, t = 0) => x.reduce((a,c) => a + c.amount, 0) >= t;

export default function Transactions(props) {
  const { items = [], stockNumber, type = "", checkLimit = 1, disabled = false, showSummary, group = "" } = props;
  const [transactions, setTransactions] = React.useState(items);

  // if(items.length <= 0) return <Loading />

  const rows = transactions.sort(sorter[type]).map(transaction => {
    return makeObject(transaction, type, {transactions, setTransactions, stockNumber});
  });
  

  const summary = summaries[type](transactions);

  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type].filter(x => StateManager.isBackoffice() || x.key !== "cost"),
    // title: 'Vehicle cost items', 
  };

  const onClick = (e) => {
    e.stopPropagation();
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");

    const destination = `/form/order-${type}?order=${stockNumber}&stock=${stockNumber}&redirect=${redirect}&tab=${tab}&type=${group}`;
    history.push(destination);
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self" sorted/>
      </Grid>
      <Grid item xs={12}>
        <Button disabled={disabled} variant="contained" color="primary" onClick={onClick}>
          Add {StateManager.formatTitle(type.slice(0, -1))}
        </Button>
      </Grid>
    </Grid>
  );
}

const BinaryIndicator = (isEnabled) => (
  isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
);

const deleteRow = async (id, updater) => {
  if (window.confirm("Are you sure you want to delete this?")) {
    StateManager.setLoading(true);
    await firebase.firestore().collection(tables[updater.type]).doc(id).delete();
    const newTransactions = updater.transactions.filter(x => x.id !== id);
    updater.setTransactions(newTransactions);
    StateManager.setLoading(false);
  }
}


const showFile = async (fileLocation) => {
  let link = document.createElement('a');
  link.href = await firebase.storage().ref(fileLocation).getDownloadURL();
  link.target = "_blank";
  link.click();
}

const makeObject = (transaction, type, params = {}) => {
  const variables = Object.keys(transaction)
  .filter(key => key !== 'e')
  .map(key => `${key}=${transaction[key]}`).join("&");

  const tab = new URL(window.location.href).searchParams.get("tab");


  if(type === "parts"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      status: StateManager.formatTitle(transaction.status || ""),
      statusSelector: SelectItem(transaction, type, "status"),
      isArrived:  BinaryIndicator(transaction.status === constants.part_statuses.at(-1)),
      arrival_date: SelectDate(transaction, type, "arrivalDate"),
      href:  LinkButton(transaction),
      actions: Actions(transaction.id, transaction.files, {...params, type}),
      rowLink: `/part/${transaction.id}`,
    }
  }

  if(type === "services"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(transaction.status === constants.service_statuses.at(-1), {type, id: transaction.id, ...params}),
      // status: StateManager.formatTitle(transaction.status),
      mechanicName:  transaction.mechanic,
      actions: Actions(transaction.id, transaction.files, {...params, type}),
      rowLink: `/service/${transaction.id}`
    }
  }

  if(type === "subcontracts"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(transaction.status === "complete", {type, id: transaction.id, ...params}),
      actions: Actions(transaction.id, transaction.files, {...params, type}),
      rowLink: `../form/edit-${type}?${type[0]}=${transaction.id}&${variables}&tab=${tab}&redirect=/service-order/${params.stockNumber}`,
    }
  }

  if(type === "expenses"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(!transaction.isPayable, {type, id: transaction.id, disabled: true, ...params}),
      actions: Actions(transaction.id, transaction.files, {...params, type}),
      rowLink: `../form/edit-${type}?${type[0]}=${transaction.id}&${variables}&tab=${tab}&redirect=/service-order/${params.stockNumber}`,
    }
  }

  return {};

}

const Actions = (id, files, updater, showDelete = true) => (
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
    {
      showDelete && StateManager.isAdmin() ?     
        <IconButton
          aria-label="add-link"
          color="gray"
          onClick={(e) => {
            e.stopPropagation()
            deleteRow(id, updater)
            }}
          size="large">
          <Delete />
        </IconButton>
        : null
    }
  </>
);


const LinkButton = (part) => {
  const onClick = (e) => {
    e.stopPropagation();
    window.open(part.link, "_blank");
  }

  return (
    <IconButton aria-label="add-link" color="error" onClick={onClick} size="large">
      <ExitToApp />
    </IconButton>
  );
};


const ToggleIndicator = (isEnabled, params) => {

  const toggleChecked = async (e) => {
    e.stopPropagation();
    if(params.disabled) return;

    const status = constants.service_statuses.at(!!isEnabled ? 0 : -1);
    const status_time = !!isEnabled ? null : moment().format("YYYY/MM/DD");
    await firebase.firestore().collection(tables[params.type]).doc(params.id).update({status, status_time});
    const newTransactions = params.transactions.map(x => {
      if(x.id === params.id){
        x.status = status
        x.status_time = status_time
      };
      return x
    });
    params.setTransactions([...newTransactions]);
  }

  return (
    <IconButton aria-label="add-link" color="primary" onClick={toggleChecked} size="large">
      {isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}


const SelectItem = (item, type, key) => {
  const { id } = item;
  const [value, setValue] = React.useState(item[key] || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    await firebase.firestore().collection(type).doc(id).update({[key]: value});
  }

  return (
    <Select
      labelId={id}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
    >
      {constants.makeSelects("part_statuses").map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
}



const SelectDate = (item, type, key) => {
  const {id} = item;

  const dateUpdate = async (field_id, date) => {
    const new_date = !date ? "" : moment(date).format('YYYY-MM-DD')
    let update = {[field_id]: new_date};
    await firebase.firestore().collection(type).doc(id).update(update);
  }

  return (
    <DateSelector id={key} data={item} updater={dateUpdate} value={item.arrivalDate} minDate drop_is/>
  )
}