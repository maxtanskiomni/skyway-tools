import { CircularProgress } from '@mui/material';
import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import history from '../utilities/history';
import { StateManager } from '../utilities/stateManager';


export default function TabContainer(props) {
  const { sections, payload = [] } = props;

  const defaultKey = new URL(window.location.href).searchParams.get("tab");
  const defaultIndex = Math.max(Object.keys(sections).indexOf(defaultKey), 0);

  const updateURL = (index) => {
    index = Object.keys(sections)[index]
    const url = new URL(window.location.href);
    let params = url.pathname
    if(url.search === '') params += "?tab="+index;
    else if(url.search.indexOf('tab=') < 0) params += url.search + "&tab="+index;
    else params += url.search.replace(/tab=.*[^&]/g, "tab="+index);
    history.replace(params)
    props.selectCallback && props.selectCallback();
  };


  return (
    <>
      <Tabs defaultIndex={defaultIndex} onSelect={updateURL}>
        <TabList>
          { Object.keys(sections).map((section, i) => <Tab>{formatTitle(section)}</Tab>) }
        </TabList>
          { 
            StateManager.loading ||
            Object.values(sections).map((panel, i) => <TabPanel>{panel(payload)}</TabPanel>) 
          }
      </Tabs>
    </>
  );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
