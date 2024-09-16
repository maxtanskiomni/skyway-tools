import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import ServiceCard from '../../components/ServiceCard';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import moment from 'moment';

import Board, { moveCard } from "@asseinfo/react-kanban";
import "@asseinfo/react-kanban/dist/styles.css";

import Blade from '../../components/Blade.js';
import UnassignedServicesDrawer from  "./UnassignedServicesDrawer";
import MechanicUpdatePopup from './SOUpdatePopup';
import ServiceFrom from '../../components/forms/ServiceForm.js';


export default function Mechanics(props) {
  const { status = "status", filter = "pending", stages = constants.mechanicNames } = props;
  const [board, setBoard] = React.useState({columns: []});
  const [loading, setLoading] = React.useState(true);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [unassignedServices, setUnassignedServices] = React.useState([]);
  StateManager.setUnassignedServices = setUnassignedServices;

  const [openBlade, setBladeOpen] = React.useState(false);
  const [selectedService, setSelected] = React.useState(false);
  StateManager.showService = (service = {}) => {
    setBladeOpen(!openBlade);
    setSelected(service);
  }

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const db = firebase.firestore();
      const snap = await db.collection('services')
                                .where(status, '!=', filter)
                                .get();

      let services = snap.docs.map(doc => ({...doc.data(), id: doc.id, type: status}));
      services = services.sort((a,b) => a.stock >= b.stock);
      
      const orderPromises = services.map(async x => {
        let order = await db.doc(`orders/${x.order}`).get()
        order = order.data() || {};

        let customer = {}
        if(order.customer){
          customer = await db.doc(`customers/${order.customer}`).get();
          customer = customer.data() || {}
        }

        let car = {}, service = {};
        if(order.car){
          service = await db.doc(`services/${order.car}`).get();
          service = service.data() || {}

          car = await db.doc(`cars/${order.car}`).get();
          car = car.data() || {}
        }

        return {...x, order, service, car, customer}
        
      })
      services = await Promise.all(orderPromises);

      const unassigned = services
        .filter(service => ["working"].includes(service.order.status))
        .filter(service => ["", "Placeholder"].includes(service.mechanic || ""))
        .map(mapCarToCard).map(x => x.content);
      //&& ["Awaiting Parts", "working", "estimate"].includes(service.order.status)
      setUnassignedServices(unassigned);
      
      const columns = stages.map(stage => {
        const cards = services.filter(
          service => (service.mechanic || "") == stage &&  constants.order_statuses.filter(x => !["estimate", "approval", "complete", "payment", "deleted"].includes(x)).includes(service.order.status)
        ).map(mapCarToCard).sort((a,b) =>( a.content.priority || 999) - (b.content.priority || 999));
        const count = cards.length;
        const times = cards.map(({content}) => moment().diff(content["date"], 'days')).filter(x => x>0);
        const averageTime = Math.round(times.reduce((a, c) => a + c, 0) / (times.length || 1));
        const hours = Math.round(100*cards.reduce((a, c) => a + (c.content.time || 0), 0))/100;

        return {
          id: stage,
          title: stage.charAt(0).toUpperCase() + stage.substring(1).toLowerCase() + `: ${hours} hour${hours > 1 ? "s":""} assigned `,
          backgroundColor: "#fff",
          cards,
        }
      });
    
      const board = {
        columns
      };
      console.log(board)
      // await firebase.firestore().collection('service-boards').doc(moment().format("YYYY/MM/DD")).set(board, {merge:true});
      setBoard(board);
      setLoading(false);
    }
    fetchData();
    StateManager.resetBoard = fetchData;
  }, []);

  const updateCard = async (columns, card, source, destination) => {
    const [mechanic, ...rest] = constants.mechanics.filter(x => x.name === destination.toColumnId);
    console.log(mechanic, destination.toPosition)
    const data = {
      mechanic: mechanic.name || "", 
      mechanicID: mechanic.id || "", 
      priority: destination.toPosition+1 || 1,
      rate: mechanic.rate,
      cost: (mechanic.rate || 0) * card.content.time,
    };
    await firebase.firestore().collection('services').doc(card.id).set(data, {merge:true});
  }

  return (
    loading
    ? <CircularProgress />
    : (
      <div style={{minHeight: 900, padding: 10}}>
        <Button variant="contained" color="primary" onClick={() => setDrawerOpen(true)}>Show Unassigned Services</Button>
        <UnassignedServicesDrawer
          open={drawerOpen}
          services={unassignedServices}
          onClose={() => setDrawerOpen(false)}
        />
        <Board
          disableColumnDrag
          initialBoard={board}
          renderCard={({ action, content }, { dragging }) => (
            <ServiceCard action={action} dragging={dragging} {...content} type="service" object_key="id" hideSelect/>
          )}
          onCardDragEnd={updateCard}
        />
        <MechanicUpdatePopup />
        <Blade open={openBlade} onClose={() => setBladeOpen(false)} title={selectedService.name || "Service Form"} >
          <ServiceFrom data={selectedService} />
        </Blade>
      </div>
    )
  );
}

const mapCarToCard = service => {
  const {car = {}, order = {}} = service;
  const carTitle = `${car.stock || ""} ${car.year || ""} ${car.model || ""}`
  return {
    id: service.id,
    title: `${order.name}`,
    description: `${service.name}`,
    content: {...service, type: "date", title: `${service.name}`, customer: order.stock, stock: order.stock, car: carTitle || "", thumbnail: order.thumbnail || ""},
    action: () => StateManager.showService(service)
  };
}

