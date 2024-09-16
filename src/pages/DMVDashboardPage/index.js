import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Titles from './Titles.js';
import firebase from '../../utilities/firebase';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import history from '../../utilities/history';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { StateManager } from '../../utilities/stateManager.js';


export default function DealDashboard(props) {
  const { month } = props.match.params;
  StateManager.setTitle("DMV Dashboard");

  const sections = {
    'title-Copies': (i) => <Titles field={'is_title_front'} value={false} title={'Cars that need title copies'} />,
    'titles-Actual': (i) => <Titles field={'is_title_received'} value={false} title={'Cars that need actual titles'} />,
    // 'funding': (i) => <Funding month={month} />,
    // 'commissions': (i) => <Commissions />,
    // 'inventory': (i) => <Deals month={month} />,
    // 'taxes': (i) => <Taxes month={month} />,
    // 'new-deposits': (i) => <Deposits />,
  };

  const defaultKey = new URL(window.location.href).searchParams.get("tab");
  const defaultIndex = Math.max(Object.keys(sections).indexOf(defaultKey), 0);

  const updateURL = (index) => {
    index = Object.keys(sections)[index]
    const url = new URL(window.location.href);
    let params = url.pathname
    if(url.search === '') params += "?tab="+index;
    else if(url.search.indexOf('tab=') < 0) params += url.search + "&tab="+index;
    else params += url.search.replace(/tab=\d*/g, "tab="+index);
    history.replace(params)
  }

  return (
    <>
      <Tabs defaultIndex={defaultIndex} onSelect={updateURL}>
        <TabList>
          { Object.keys(sections).map((section, i) => <Tab>{formatTitle(section)}</Tab>) }
        </TabList>
          { Object.values(sections).map((panel, i) => <TabPanel>{panel()}</TabPanel>) }
      </Tabs>
    </>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}