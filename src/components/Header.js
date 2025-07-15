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
import AddCarDialog from './AddCarDialog';
import AddServiceOrderDialog from './AddServiceOrderDialog';
import {
  ListItemIcon,
  ListItemText,
  Box,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Bolt as BoltIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { menuSections, userSection, renderMenuSections } from '../config/menuItems';

export default function Header(props) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [anchor, setAnchor] = React.useState(null);
    const [results, setResults] = React.useState([]);
    const [selected, setSelected] = React.useState(0);
    const [isAddCarDialogOpen, setIsAddCarDialogOpen] = React.useState(false);
    const [isAddServiceOrderDialogOpen, setIsAddServiceOrderDialogOpen] = React.useState(false);

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

      hits = hits.map((list, i) => {
        
        if(i>0) return list

        list.sort((a, b) => {
          // Extract the stock number (numbers only) or set it to Infinity if there's no stock
          const stockA = a.stock ? parseInt(a.stock.replace(/\D/g, ''), 10) : Infinity;
          const stockB = b.stock ? parseInt(b.stock.replace(/\D/g, ''), 10) : Infinity;
        
          // First, compare by stock number (numerically)
          if (stockA !== stockB) {
            return stockB - stockA;
          }
        
          // If stock numbers are the same or non-existent, compare by name (alphabetically)
          return (a.last_name || "").localeCompare(b.last_name);
        })
        return list;
      }).flat();

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

    const addCar = () => {
      setIsAddCarDialogOpen(true);
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

    const addServiceOrder = () => {
      setIsAddServiceOrderDialogOpen(true);
      handleClose();
    }

    const handleAction = (action) => {
      switch (action) {
        case 'addCar':
          setIsAddCarDialogOpen(true);
          break;
        case 'addServiceOrder':
          setIsAddServiceOrderDialogOpen(true);
          break;
        case 'signOut':
          firebase.auth().signOut();
          history.go(0);
          break;
        default:
          break;
      }
      handleClose();
    };

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
              autoComplete="off"
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
            elevation={3}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            open={Boolean(anchor)}
            onClose={handleClose}
            PaperProps={{
              className: classes.menuPaper,
            }}
          >
            <MenuItem 
              className={classes.homeMenuItem}
              onClick={() => navigate('/')}
            >
              <ListItemIcon className={classes.menuItemIcon}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </MenuItem>

            {renderMenuSections(StateManager, navigate, handleAction, classes)}
          </Menu>
        </Toolbar>
        <ResultsList results={results} selected={selected}/>
      </AppBar>
      <div className={classes.appBarSpacer} />

      <AddCarDialog 
        open={isAddCarDialogOpen}
        onClose={() => setIsAddCarDialogOpen(false)}
      />

      <AddServiceOrderDialog
        open={isAddServiceOrderDialogOpen}
        onClose={() => setIsAddServiceOrderDialogOpen(false)}
      />
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
    menuPaper: {
      width: 320,
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
      },
    },
    menuSection: {
      padding: theme.spacing(1, 0),
    },
    menuSectionTitle: {
      padding: theme.spacing(1, 2),
      color: theme.palette.text.secondary,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: theme.palette.action.hover,
    },
    menuItem: {
      padding: theme.spacing(1, 2),
      minHeight: 48,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    menuItemIcon: {
      minWidth: 40,
      color: 'inherit',
    },
    menuItemText: {
      fontSize: '0.875rem',
    },
    divider: {
      margin: theme.spacing(1, 0),
    },
    homeMenuItem: {
      padding: theme.spacing(1.5, 2),
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
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