import React from 'react';
import Typography from '@mui/material/Typography';
import 'react-tabs/style/react-tabs.css';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js';
import { useTheme } from '@mui/material/styles';

import SimpleTable from '../../components/SimpleTable';

import Preview from '../../components/Preview.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import StatusLine from '../../components/StatusLine';
import Dropdown from '../../components/Dropdown.js';
import PaperDiv from '../../components/PaperDiv.js';
import RequestManager from '../../utilities/requestManager.js';
import { IconButton, MenuItem, Select } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Delete } from '@mui/icons-material';

export default function Service(props) {
    const theme = useTheme();
    const { order = {} } = props;
    const { services = [] } = order;

    const updater = (table, data) => firebase.firestore().collection(table).doc().set(data, {merge: true});

    const makeService = () => {
      const new_services = [...services, {name: `Service #${services.length + 1}`, date: moment().format("YYYY/MM/DD")}];
      StateManager.setOrder({...order, services: new_services});
    }

    const makeItem = (order_index) => {
      let new_services = [...services];
      new_services[order_index].items = [...(new_services[order_index].items || []), {}];
      StateManager.setOrder({...order, services: new_services});
    }

    const updateService = (params) => {
      // const {order_index, service_index = -1, property, value = ""} = params;
      // let new_orders = [...services];

      // if(service_index < 0 ) new_orders[order_index][property] = value;
      // else new_orders[order_index].services[service_index][property] = value;

      // StateManager.setOrder({...order, services: [...new_orders]});
    }

    const deleteOrder = (order_index) => {
      if (window.confirm("Are you sure you want to delete this?")) {
        let order = services[order_index];
        const new_orders = services.filter(x => x.id !== order.id);

        StateManager.setOrder({...order, services: [...new_orders]});
        firebase.firestore().doc(`services/${order.id}`).delete();
      }
    }

    return (
        <>
          {
            services.length < 1 && (
              <PaperDiv>
                <Typography variant={"h6"} align="left" style={{padding: 7}}>
                  No active services
                </Typography>
              </PaperDiv>
            )
          }
          {
            services.map((service, i) => {
              const {name, items = [], status = "pending", mechanic = "pending" } = service;

              const label = (
                <div onClick={(e) => e.stopPropagation()}>
                  <TextField
                    onChange={(e) => updateService({service_index: i, property: "name", value: e.target.value})}
                    id={"item-name"} 
                    name={"item-name"}
                    value={name}
                    placeholder={"Add service name"} 
                    multiline={true} 
                    disabled={order.isSaved}
                    InputProps={{ disableUnderline: true, style:{color: "black", fontSize:18, fontWeight: "bold"} }}
                    fullWidth
                  />
                </div>
              )


              const rows = items.sort((a,b) => a.type - b.type).map(item => {
                item.selectType = SelectType(item);
                item.quanityInput = TextInput(item);
                item.markComplete = BinaryIndicator(item);
                item.actions = DeleteButton(item);

                return item
              });
              const summary = [
                {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)}
              ];

              const tableData = {
                rows,
                summary,
                headers: [
                  {key:'markComplete', label:''}, 
                  {key:'selectType', label:'Type'}, 
                  {key:'quanityInput', label:'Quantity'}, 
                  {key:'amount', label:'Amount', format:'usd'}, 
                  {key:'actions', label:'Actions', noLink:true}
                ],
                title: '', 
              };

              return (
                <Dropdown id={name} label={label} expand={!order.isSaved} value={formatTitle(status)} >
                  <Typography variant={"p"} align="left" style={{paddingBottom: 7}}>
                    Service Date: {moment(service.date_created).format("MM/DD/YYYY")}
                  </Typography>
                  <Typography variant={"p"} align="left" style={{paddingBottom: 7}}>
                    Status: {formatTitle(status)}
                  </Typography>
                  <Typography variant={"p"} align="left" style={{paddingBottom: 7}}>
                    Mechanic: {formatTitle(mechanic)}
                  </Typography>

                  <SimpleTable {...tableData}/>
                  {/* {
                    components
                  } */}
                  
                  <div style={{marginTop: 10}}>
                    <Button variant="contained" color="secondary" onClick={() => makeItem(i)}>
                        Add item
                    </Button>
                    <Button variant="contained" onClick={() => deleteOrder(i)} style={{backgroundColor: theme.palette.error.main,}}>
                        Delete Serivce Order
                    </Button>
                  </div>
                </Dropdown>
              )

            })
          }
          <div style={{marginTop: 10}}>
            <Button variant="contained" color="primary" onClick={makeService}>
                Add service
            </Button>
          </div>
        </>
    );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}


const SelectType = (item) => {
  const types = [
    {value: "labor", label: "Labor"},
    {value: "part", label: "Part"},
    {value: "subcontractor", label: "Subcontractor"},
  ];

  const {id} = item;
  const [value, setValue] = React.useState(item.type || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    // await firebase.firestore().collection('checks').doc(id).update({bank: value});
  }

  return (
    <Select
      labelId={id}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
    >
      {types.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
}

const DeleteButton = (item) => {
  const {id} = item;

  const deleteRow = async (id, updater) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      StateManager.setLoading(true);
      // await firebase.firestore().collection(tables[updater.type]).doc(id).delete();
      StateManager.setLoading(false);
    }
  }

  return (
    <IconButton
      aria-label="delete"
      color="error"
      onClick={(e) => {
        e.stopPropagation()
        deleteRow(id)
        }}
      size="large">
      <Delete />
    </IconButton>
  );
}

const TextInput = (item) => {
  const {id} = item;
  const [value, setValue] = React.useState(item.type || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    // await firebase.firestore().collection('checks').doc(id).update({bank: value});
  }

  return (
    <TextField
      inputProps={{style: { textAlign: 'center'}}}
      style={{maxWidth: "30%", width:"50%"}}
      id={id+"text"}
      label={""}
      value={value}
      onChange={onChange}
    />
  )
}

const BinaryIndicator = (item) => {
  const {id} = item;
  const [isEnabled, toggle] = React.useState(!!item.type);

  const toggleIcon = async (e) => {
    let isComplete = !isEnabled
    toggle(isComplete);
    await firebase.firestore().collection('services').doc(id).update({isComplete});
  }

  return (
    <IconButton
      aria-label="delete"
      color="error"
      onClick={(e) => {
          e.stopPropagation()
          toggleIcon()
        }}
      size="large">
      {isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />}
    </IconButton>
  );
}