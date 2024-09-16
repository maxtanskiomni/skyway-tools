import React from 'react';
import Grid from '@mui/material/Grid';
import TabContainer from '../../components/TabContainer.js';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';
import Tasks from './Tasks.js';

import { StateManager } from "../../utilities/stateManager.js";
import SelectLine from '../../components/SelectLine.js';
import constants from '../../utilities/constants.js';
import IconButton from '@mui/material/IconButton';
import { Delete } from '@mui/icons-material';


export default function TaskDashboard(props) {
  const { employee = "" } = props.match.params;
  const [payload, setPayload] = React.useState([]);
  StateManager.setTitle("Task Dashboard");

  React.useEffect(() => {
    async function fetchData() {
      StateManager.setLoading(true);
      const db = firebase.firestore();
      const dealSnap = await db.collection('tasks').where('owner', '==', employee).get();

      async function getDealData() {
        const promises = dealSnap.docs.map( 
          async (doc, i) => {
            //Deal data
            let data = doc.data();
            data.id = doc.id;
            data.stock = data.stock || "N/A";
            data.complete_indicator = StateManager.binaryIndicator(data.is_complete);
            data.actions = Actions(doc.id);

            if(data.stock !== "N/A") {
              let car = await db.doc('cars/'+data.stock).get();
              car = {id: car.id, ...car.data()};
              data.car = car;
              data.stock = `${data.stock} ${car.year} ${car.model}`;
            }

            const variables = "&"+Object.keys(data).map(key => `${key}=${data[key]}`).join("&");
            const url = new URL(window.location.href);
            const tab = url.searchParams.get("tab");
            const redirect = `&tab=${tab}&redirect=${url.pathname}`;

            data.rowLink = "/form/edit-task?t="+doc.id+variables+redirect;
  
            return data;
          }
        );
  
        let rows = await Promise.all(promises);
        return rows;
      }

      const tableData = await getDealData();

      setPayload(tableData.flat());

      StateManager.setLoading(false);
    }
    fetchData();
  }, [employee]);

  const sections = {
    'pending': (i) => <Tasks rows={i} filter={x => !x.is_complete} />,
    'complete': (i) => <Tasks rows={i} filter={x => x.is_complete} />,
  };

  const updateEmployee = (key, value) => {
    const url = new URL(window.location.href);
    history.push("/task-dashboard/"+value+url.search);
  }

  return (
    <>
      <Grid style={{padding: 20}}>
        <SelectLine 
          id={'owner'}
          label="Employee" 
          selections={constants.makeSelects("employees").slice(1)}
          updater={updateEmployee}
          data={{owner: employee}}
        />
      </Grid>
      <TabContainer payload={payload} sections={sections}/>
    </>
  );
}

const deleteRow = async (id) => {
  if (window.confirm("Are you sure you want to delete this?")) {
    StateManager.setLoading(true);
    await firebase.firestore().collection("tasks").doc(id).delete();
    history.go(0);
  }
}

const Actions = (id) => (
  <>
    <IconButton
      aria-label="add-link"
      color="error"
      onClick={(e) => {
        e.stopPropagation()
        deleteRow(id);
        }}
      size="large">
      <Delete />
    </IconButton>
  </>
);