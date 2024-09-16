import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Kanban from './Kanban.js';
import { StateManager } from '../../utilities/stateManager.js';
import { useHistory } from 'react-router-dom'
import TabContainer from '../../components/TabContainer.js';
import constants from '../../utilities/constants.js';


export default function Pipeline(props) {
  const history = useHistory() ;
  StateManager.setMaxWidth(false);

  React.useEffect(() => {
      return history.listen((location) => { 
        const maxWidth = location.pathname === "/pipeline" ? false : "lg";
        StateManager.setMaxWidth(maxWidth);
      }) 
  },[history]) 

  StateManager.setTitle("Process Dashboard");

  const sections = {
    // 'master-pipeline': (payload) => <Kanban/>,
    'working-pipline': (payload) => <Kanban status="sub_status" filter="complete" stages={constants.sub_statuses.slice(0, -1)}/>,
    'admin-issues': (payload) => <Kanban filter="complete" stages={constants.statuses.slice(5, -1)}/>,
  };

  return (
    <>
      <TabContainer sections={sections}/>
    </>
  );
}
