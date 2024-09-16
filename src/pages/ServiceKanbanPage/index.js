import React from 'react';
import 'react-tabs/style/react-tabs.css';
import Kanban from './Kanban.js';
import Mechanics from './Mechanics.js';
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

  StateManager.setTitle("Service Pipeline");

  // const sections = {
  //   'service-pipline': (payload) => <Kanban filter="complete" stages={constants.order_statuses.slice(0,-2)}/>,
  //   'mechanic-dashboard': (payload) => <Mechanics filter="complete" stages={["", ...constants.mechanicNames.filter(x => x !== "Jhonner Caldera")]}/>,
  // };

  return (
    <>
      {/* <TabContainer sections={sections}/> */}
      <Mechanics filter="complete" stages={[...constants.mechanics.map(x => x.name).filter(x => !["Placeholder"].includes(x))]}/>
    </>
  );
}
