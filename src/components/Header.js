import React from 'react';

import clsx from 'clsx';
import makeStyles from '@mui/styles/makeStyles';
import AppBar from '@mui/material/AppBar';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';
import { mainListItems, secondaryListItems } from './Toolbar';
import history from '../utilities/history';
import Store, {cleanStockNumber} from '../utilities/store';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import moment from 'moment';
import constants from '../utilities/constants';
import firebase from '../utilities/firebase';
import algolia from '../utilities/algolia';
import { v4 as uuidv4 } from 'uuid';
import { StateManager } from '../utilities/stateManager';
import Backdrop from '@mui/material/Backdrop';
import ResultsList from './ResultsList';

export default function Header(props) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [anchor, setAnchor] = React.useState(null);
    const [results, setResults] = React.useState([]);
    const [selected, setSelected] = React.useState(0);

    const hendleOpen = (event) => {
      console.log('open')
      setAnchor(event.currentTarget);
    };

    const handleClose = () => {
      setAnchor(null);
    };

    const updateValue = async (e) => {
      const { value } = e.target;
      setSearch(value);

      if(value == ""){
        setResults([]);
        return;
      }

      const indicies = ["cars", "orders", "customers"];
      const queries = indicies.map(name => ({indexName: name, query: value}))
      const { results } = await algolia.client.multipleQueries(queries);
      // console.log(results)

      let hits = [];
      indicies.forEach((type, i) => {
        const cur_hits = results[i].hits.map(hit => ({
          ...hit, 
          action: getAction(hit, type),
          label: getLabel(hit, type)
        }));
        hits = [...hits, cur_hits];
      });
      hits = hits.flat();
      setResults(hits);
    }

    const keyPress = (e) => {
      if(e.key === "Enter") return results[selected].action();

      if(e.key === "Escape") {
        setSearch("");
        setResults([]);
        return;
      }

      let newActive = selected;
      if(e.key === "ArrowUp") newActive -=  1;
      if(e.key === "ArrowDown") newActive += 1;
      newActive = Math.max( Math.min(results.length, newActive), 0)
      setSelected(newActive);
    }

    const addLead = () => {
      history.push(`/form/add-task?`);
      handleClose();
    }

    // const addLead = () => {
    //   const id = uuidv4();
    //   history.push(`/form/new-lead?c=${id}`);
    //   handleClose();
    // }

    const addRepair = () => {
      const url = new URL(window.location.href)
      const redirect = url.pathname
      const otherVars = url.search.replace("?", "");
      history.push(`/form/new-repair?redirect=${redirect}&${otherVars}`);
      handleClose();
    }

    const addPart = () => {
      history.push(`/form/new-part`);
      handleClose();
    }

    const addInvoice = () => {
      const url = new URL(window.location.href)
      const redirect = url.pathname
      const otherVars = url.search.replace("?", "");
      history.push(`/form/add-invoice?redirect=${redirect}&${otherVars}`);
      handleClose();
    }

    const addExpense = () => {
      const url = new URL(window.location.href)
      const redirect = url.pathname;
      const otherVars = url.search.replace("?", "");
      history.push(`/form/add-expenses?redirect=${redirect}&${otherVars}`);
      handleClose();
    }

    const addCar = async () => {
      const counters = await firebase.firestore().doc('admin/counters').get();
      const new_stock = counters.data().lastStock + 1;
      const url = new URL(window.location.href);
      const redirect = url.pathname;
      history.push(`/form/add-car?stock=${new_stock}&redirect=${redirect}`);
      handleClose();
    }


    const addSO = async () => {
      const counters = await firebase.firestore().doc('admin/counters').get();
      const new_stock = counters.data().lastOrder + 1;
      history.push(`/service-order/SO${new_stock}`);

      await firebase.firestore().doc('orders/'+`SO${new_stock}`).set({
        status: constants.service_statuses[0],
        date: moment().format('YYYY/MM/DD'),
        status_time: moment().format('YYYY/MM/DD'),
        stock: `SO${new_stock}`,
        status: constants.order_statuses[0],
      });

      await firebase.firestore().doc('admin/counters').update({lastOrder: new_stock});
      handleClose();
    }

    const makeShippingInvoice = async () => {
      const invoice = uuidv4();
      const url = new URL(window.location.href)
      const redirect = url.pathname;
      history.push(`/form/shipping?redirect=${redirect}&i=${invoice}`);
      handleClose();
    }

    const gotoTimesheets = () => {
      const date = moment().format("YYYY-MM-DD");
      navigate(`/timesheets/${date}`);
    }

    const navigate = async (location) => {
      history.push(location);
      handleClose();
    }

    const signOut = async () => {
      await firebase.auth().signOut();
      history.go(0);
      handleClose();
    }

  
    return <>
      <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)}>
        <Toolbar className={classes.toolbar} style={{justifyContent: 'space-between'}}>
          <a href={'/'}>
            <img className={classes.logo} src={"/logo-clear.png"} alt="image" />
          </a>
          {
            StateManager.authed &&
            <TextField
              className={classes.title}
              value={search}
              style={{backgroundColor: 'white', maxWidth: '55%'}}
              onChange={updateValue}
              onKeyDown={keyPress}
              placeholder={props.title || 'Search for something..'}
            />
          }
          {
            StateManager.authed &&
            <IconButton color="inherit" onClick={hendleOpen} size="large">
              <MenuIcon />
            </IconButton>
          }
          <Menu
            id="menu"
            anchorEl={anchor}
            // getContentAnchorEl={null}
            elevation={0}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            keepMounted
            open={Boolean(anchor)}
            onClose={handleClose}
          >
            {/* <MenuItem onClick={() => history.push(`/sales-dashboard`)}>Lead Dashboard</MenuItem> */}
            <MenuItem onClick={() => navigate(`/`)}>Home</MenuItem>
            {StateManager.isUserAllowed("pipeline") && <MenuItem onClick={() => navigate(`/pipeline`)}>Process Pipeline</MenuItem>}
            {StateManager.isUserAllowed("service-pipeline") && <MenuItem onClick={() => navigate(`/service-pipeline`)}>Service Pipeline</MenuItem>}
            {StateManager.isUserAllowed("service-pipeline") && <MenuItem onClick={() => navigate(`/service-priorities`)}>Service Priorities</MenuItem>}
            {StateManager.isUserAllowed("service-board") && <MenuItem onClick={() => navigate(`/service-board`)}>Service Board</MenuItem>}
            {StateManager.isUserAllowed("parts-pipeline") && <MenuItem onClick={() => navigate(`/parts-pipeline`)}>Parts Pipeline</MenuItem>}
            {StateManager.isUserAllowed("deal-dashboard") && <MenuItem onClick={() => navigate(`/deal-dashboard/${moment().format("YYYY-MM")}`)}>Deal Dashboard</MenuItem>}
            {StateManager.isUserAllowed("accounting") && <MenuItem onClick={() => navigate(`/accounting`)}>Accounting Dashboard</MenuItem>}
            {StateManager.isUserAllowed("dmv-dashboard") && <MenuItem onClick={() => navigate(`/dmv-dashboard`)}>DMV Dashboard</MenuItem>}
            {StateManager.isUserAllowed("mechanic-summary") && <MenuItem onClick={() => navigate(`/mechanic-summary/${moment().format("YYYY-MM-DD")}/${moment().subtract(2, "weeks").format("YYYY-MM-DD")}`)}>Mechanic Summary</MenuItem>}
            {StateManager.isUserAllowed("payroll") && <MenuItem onClick={() => navigate(`/payroll/${moment().format("YYYY-MM-DD")}`)}>Payroll Dashboard</MenuItem>}
            {StateManager.isUserAllowed("leads") && <MenuItem onClick={() => navigate(`/leads`)}>Leads</MenuItem>}
            {StateManager.isUserAllowed("credit-apps") && <MenuItem onClick={() => navigate(`/credit-apps`)}>Credit Apps</MenuItem>}
            {/* {StateManager.isUserAllowed("backoffice") && <MenuItem onClick={() => navigate(`/backoffice`)}>Back Office</MenuItem>} */}
            {/* {StateManager.isUserAllowed("purchase_orders") && <MenuItem onClick={() => navigate(`/payroll/${moment().format("YYYY-MM-DD")}`)}>Payroll Dashboard</MenuItem>} */}
            {/* <MenuItem onClick={() => navigate(`/purchase_orders`)}>Purchase Orders</MenuItem> */}
            {/* <MenuItem onClick={gotoTimesheets}>Timesheets</MenuItem> */}
            {StateManager.isUserAllowed("add-car") && <MenuItem onClick={addCar}>Add Car</MenuItem>}
            {StateManager.isUserAllowed("make-service") && StateManager.isAdmin() && <MenuItem onClick={addSO}>Make Service Order</MenuItem>}
            {StateManager.isUserAllowed("inventory") && <MenuItem onClick={() => navigate(`/inventory`)}>inventory</MenuItem>}
            {/* {StateManager.isUserAllowed("make-shipping") && <MenuItem onClick={makeShippingInvoice}>Make Shipping Invoice</MenuItem>} */}
            {<MenuItem onClick={addInvoice}>Add Invoice</MenuItem>}
            {/* <MenuItem onClick={addInvoice}>Add Unpaid Bill</MenuItem>
            <MenuItem onClick={addRepair}>Add Repair</MenuItem>
            
            <MenuItem onClick={addExpense}>Add Paid Expense</MenuItem>
            <MenuItem onClick={addLead}>Add Task</MenuItem> */}
            <MenuItem onClick={signOut}>Sign Out</MenuItem>
          </Menu>
        </Toolbar>
        <ResultsList results={results} selected={selected}/>
      </AppBar>
      <div className={classes.appBarSpacer} />
    </>;
  }

  const drawerWidth = 240;

  const useStyles = makeStyles((theme) => ({
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    logo:{
      width: 124,
      margin: 10
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarSpacer: theme.mixins.toolbar,
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    title: {
      flexGrow: 1,
    },
    appBarSpacer: theme.mixins.toolbar,
  }));

  const getLabel = (hit, type) => {
    const highlights = hit._highlightResult
    if(type === "cars") {
      const stock = highlights.stock?.value || "";
      const car = (highlights.year?.value || "") + " " + (highlights.make?.value || "") + " " + (highlights.model?.value || "")
      return `${stock} - ${car}`;
    }
    if(type === "customers"){
      const name = (highlights.first_name?.value || "") + " " + (highlights.last_name?.value || "")
      const address = (highlights.address1?.value || "") + " " + (highlights.state?.value || "") + " " + (highlights.zip?.value || "")
      return `${name} - ${address}`;
    }
    if(type === "orders"){
      return `${highlights.id?.value || ""}`;
    }
  }

  const getAction = (hit, type) => {
    let action = () => null
    if(type === "cars") {
      action = () => {
        history.push(`/car/${hit.stock}`);
        window.location.reload(false);
      }
    }
    if(type === "customers"){
      action = () => {
        history.push(`/customer/${hit.objectID}`);
        window.location.reload(false);
      }
    }
    if(type === "orders"){
      action = () => {
        history.push(`/service-order/${hit.objectID}`);
        window.location.reload(false);
      }
    }
    return action
  }