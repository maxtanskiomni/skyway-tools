import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CustomerSummary from './CustomerSummary.js';
import CarList from './CarList.js';
import ServiceList from './ServiceList.js';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import Preview from '../../components/Preview.js';

export default function CustomerPage(props) {
  const { id } = props.match.params;

  const tabs = {
    // 'checklist': (i) => <Checklist stockNumber={stockNumber}/>,
    'summary': (i) => <CustomerSummary cust_id={id}/>,
    'cars': (i) => <CarList cust_id={id}/>,
    'service': (i) => <ServiceList cust_id={id}/>,
  };

  const defaultKey = new URL(window.location.href).searchParams.get("tab");
  const defaultIndex = Math.max(Object.keys(tabs).indexOf(defaultKey), 0);

  const updateURL = (index) => {
    index = Object.keys(tabs)[index]
    const url = new URL(window.location.href);
    let params = url.pathname
    if(url.search === '') params += "?tab="+index;
    else if(url.search.indexOf('tab=') < 0) params += url.search + "&tab="+index;
    else params += url.search.replace(/tab=.*[^&]/g, "tab="+index);
    history.replace(params)
  }

  return (
    <>
      <Tabs defaultIndex={+defaultIndex} onSelect={updateURL}>
        <TabList>
          { Object.keys(tabs).map((section, i) => <Tab>{formatTitle(section)}</Tab>) }
        </TabList>
        { Object.values(tabs).map((panel, i) => <TabPanel>{panel()}</TabPanel>) }
      </Tabs>
    </>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}