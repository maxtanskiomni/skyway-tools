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
import { Delete, Receipt, CheckBox, CheckBoxOutlineBlank, ExitToApp, Sync } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import { MenuItem, Select, TextField } from '@mui/material';
import moment from 'moment';
import DateSelector from '../../components/DateSelector';
import Blade from '../../components/Blade';
import ServiceEditForm from './ServiceEditForm';
import AddServiceOrderDialog from '../../components/AddServiceOrderDialog';


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
    {key:'isApproved', label:'Approved', noLink:true}, 
    {key:'name', label:'Service', noLink:true}, 
    // {key:'status', label:'Status'}, 
    {key:'mechanicName', label:'Mechanic', noLink:true},
    {key:'assignDate', label:'Assigned Date', noLink:true},
    {key:'time', label:'Hours', noLink:true}, 
    {key:'cost', label:'Cost', format:'usd', noLink:true},
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
  const [selectedService, setSelectedService] = React.useState(null);
  const [bladeOpen, setBladeOpen] = React.useState(false);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setBladeOpen(true);
  };

  const handleBladeClose = () => {
    setBladeOpen(false);
    setSelectedService(null);
  };

  const handleServiceUpdate = async (updates) => {
    if (!selectedService) return;
    
    try {
      await firebase.firestore().collection('services').doc(selectedService.id).update(updates);
      
      // Update local state
      const updatedTransactions = transactions.map(t => 
        t.id === selectedService.id ? { ...t, ...updates } : t
      );
      setTransactions(updatedTransactions);
      setSelectedService({ ...selectedService, ...updates });
    } catch (error) {
      console.error('Error updating service:', error);
      StateManager.setAlertAndOpen('Error updating service', 'error');
    }
  };

  // if(items.length <= 0) return <Loading />

  const rows = transactions.sort(sorter[type]).map(transaction => {
    const row = makeObject(transaction, type, {transactions, setTransactions, stockNumber});
    if (type === 'services') {
      row.rowAction = () => handleServiceClick(transaction);
    }
    return row;
  });
  

  const summary = summaries[type](transactions);

  const tableData = {
    rows,
    summary: showSummary ? summary : {},
    headers: headers[type].filter(x => StateManager.isBackoffice() || x.key !== "cost"),
    // title: 'Vehicle cost items', 
  };

  const [addServiceOpen, setAddServiceOpen] = React.useState(false);

  const updateSO = (newServices) => {
    // Ensure newServices is an array
    const servicesToAdd = Array.isArray(newServices) ? newServices : [newServices];
    
    // Add any missing required fields to new services
    const processedServices = servicesToAdd.map(service => ({
      ...service,
      cost: service.cost || 0,
      time: service.time || 0,
      status: service.status || constants.service_statuses[0],
      approval: service.approval || constants.approval_statuses[0],
      status_time: service.status_time || moment().format("YYYY/MM/DD"),
      approval_time: service.approval_time || moment().format("YYYY/MM/DD")
    }));

    // Update transactions with new services
    const newTransactions = [...transactions, ...processedServices];
    setTransactions(newTransactions);
  }

  const onClick = (e) => {
    e.stopPropagation();


    if(type === "services"){
      setAddServiceOpen(true);
      return;
    }
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");

    const destination = `/form/order-${type}?order=${stockNumber}&stock=${stockNumber}&redirect=${redirect}&tab=${tab}&type=${group}`;
    history.push(destination);
  }

  const omit = ["statusSelector", "actions", "href", "location", "arrival_date"];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData} linkLocation="_self" sorted omit={omit}/>
      </Grid>
      <Grid item xs={12}>
        <Button disabled={disabled} variant="contained" color="primary" onClick={onClick}>
          Add {StateManager.formatTitle(type.slice(0, -1))}
        </Button>
      </Grid>

      <AddServiceOrderDialog serviceOrderId={stockNumber} open={addServiceOpen} onClose={() => setAddServiceOpen(false)} callback={updateSO} />

      {type === 'services' && (
        <Blade open={bladeOpen} onClose={handleBladeClose} title="Edit Service">
          {selectedService && (
            <ServiceEditForm 
              service={selectedService} 
              onUpdate={handleServiceUpdate}
            />
          )}
        </Blade>
      )}
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
      statusSelector: <SelectItem key={`status-${transaction.id}`} item={transaction} type={type} fieldKey="status" />,
      isArrived:  BinaryIndicator(transaction.status === constants.part_statuses.at(-1)),
      arrival_date: <SelectDate key={`date-${transaction.id}`} item={transaction} type={type} fieldKey="arrivalDate" />,
      href:  LinkButton(transaction),
      actions: Actions(transaction, {...params, type}),
      rowLink: `/part/${transaction.id}`,
    }
  }

  if(type === "services"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(transaction.status === constants.service_statuses.at(-1), {type, id: transaction.id, ...params, disabled: transaction.approval !== "approved"}),
      isApproved:  ToggleIndicator(transaction.approval === constants.approval_statuses.at(-1), {type, id: transaction.id, option: "approval", ...params, disabled: !StateManager.isManager()}),
      mechanicName:  transaction.mechanic,
      actions: Actions(transaction, {...params, type}),
      rowLink: `/service/${transaction.id}`
    }
  }

  if(type === "subcontracts"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(transaction.status === "complete", {type, id: transaction.id, ...params}),
      actions: Actions(transaction, {...params, type}),
      rowLink: `../form/edit-${type}?${type[0]}=${transaction.id}&${variables}&tab=${tab}&redirect=/service-order/${params.stockNumber}`,
    }
  }

  if(type === "expenses"){
    return {
      ...transaction,
      cost: transaction.cost || 0,
      isComplete:  ToggleIndicator(!transaction.isPayable, {type, id: transaction.id, disabled: true, ...params}),
      actions: Actions(transaction, {...params, type}),
      rowLink: `../form/edit-${type}?${type[0]}=${transaction.id}&${variables}&tab=${tab}&redirect=/service-order/${params.stockNumber}`,
    }
  }

  return {};

}

const Actions = (transaction, updater, showDelete = true) => (
  <>
    {
      transaction.files ? <IconButton
        aria-label="add-link"
        color="secondary"
        onClick={(e) => {
          e.stopPropagation()
          showFile(transaction.files[0])
          }}
        size="large">
        <Receipt />
      </IconButton>
      : null
    }
    {
      updater.type === "services" && transaction.name?.toLowerCase().includes("inspection") ? 
        <IconButton
          aria-label="sync-inspection"
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            syncInspection(transaction, updater)
          }}
          size="large">
          <Sync />
        </IconButton>
      : null
    }
    {
      showDelete && StateManager.isBackoffice() ?     
        <IconButton
          aria-label="add-link"
          color="gray"
          onClick={(e) => {
            e.stopPropagation()
            deleteRow(transaction.id, updater)
            }}
          size="large">
          <Delete />
        </IconButton>
        : null
    }
  </>
);

const syncInspection = async (transaction, updater) => {
  StateManager.setLoading(true);
  try {
    //Get the current order data to find the stock number
    let order = await firebase.firestore().doc('orders/'+transaction.order).get();
    if (!order.exists) {
      console.error("Order not found:", transaction.order);
      return;
    }
    order = order.data();

    if (!order.car) {
      console.error("No car associated with order:", transaction.order);
      throw new Error("No car associated with order: " + transaction.order);
    }

    let updated_inspection = await firebase.firestore().doc('inspections/'+order.car).get();
    if (!updated_inspection.exists) {
      console.error("No inspection found for car:", order.car);
      throw new Error("No inspection found for car: " + order.car);
    }
    updated_inspection = updated_inspection.data();

    const issues = Object.keys(updated_inspection).filter((key) =>["red", "orange"].includes(updated_inspection[key]));

    const services = issues.map(issue => {
      const service = {
        id: firebase.firestore().collection('services').doc().id,
        order: transaction.order,
        name: `${issue} - ${updated_inspection[`${issue}-description`] || ""}`,
        isComplete: false,
        isApproved: false, 
        status: "pending",
        mechanicName: "",
        assignDate: moment().format('YYYY/MM/DD'),
        time: 0, 
        cost: 0,
      }
      return service;
    });

    const new_services = [...updater.transactions, ...services];
    updater.setTransactions(new_services);

    await Promise.all(services.map(service => 
      firebase.firestore().collection("services").doc(service.id).set(service)
    ));
    
    StateManager.setAlertAndOpen("Inspection synced successfully!", "success");
    StateManager.setLoading(false);
  } catch (error) {
    StateManager.setAlertAndOpen("Error syncing inspection: " + error.message, "error");
    StateManager.setLoading(false);
    console.error("Error syncing inspection:", error);
  }
};

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

    //have the satus array be dynamic
    const options = {
      "status": constants.service_statuses,
      "approval": constants.approval_statuses
    }

    const option = params.option || "status";

    //have the status key be dynamic

    const status = options[option].at(!!isEnabled ? 0 : -1);
    const status_time = !!isEnabled ? null : moment().format("YYYY/MM/DD");
    await firebase.firestore().collection(tables[params.type]).doc(params.id).update({[option]: status, [option + "_time"]: status_time});
    const newTransactions = params.transactions.map(x => {
      if(x.id === params.id){
        x[option] = status
        x[option + "_time"] = status_time
      };
      return x
    });
    params.setTransactions([...newTransactions]);
  }

  return (
    <IconButton 
      aria-label="add-link" 
      color="primary" 
      onClick={toggleChecked} 
      size="large" 
      disabled={params.disabled}
      sx={{
        '@media print': {
          // Force icon to be visible in print
          '& svg': {
            fill: 'currentColor !important',
            // Ensure proper size in print
            width: '24px !important',
            height: '24px !important',
            // Force display
            display: 'block !important'
          }
        }
      }}
    >
      {isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}


const SelectItem = React.memo(({ item, type, fieldKey }) => {
  const { id } = item;
  const [value, setValue] = React.useState(item[fieldKey] || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    await firebase.firestore().collection(type).doc(id).update({[fieldKey]: value});
  }

  return (
    <Select
      labelId={id}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
    >
      {constants.makeSelects("part_statuses").map( selection => <MenuItem key={selection.value} value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
});



const SelectDate = React.memo(({ item, type, fieldKey }) => {
  const {id} = item;

  const dateUpdate = async (field_id, date) => {
    const new_date = !date ? "" : moment(date).format('YYYY-MM-DD')
    let update = {[field_id]: new_date};
    await firebase.firestore().collection(type).doc(id).update(update);
  }

  return (
    <DateSelector id={fieldKey} data={item} updater={dateUpdate} value={item.arrivalDate} minDate drop_is/>
  )
});