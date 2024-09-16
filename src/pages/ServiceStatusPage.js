import React, { useEffect, useState } from 'react';
import firebase from '../utilities/firebase';
import { Box, Card, Grid, Typography } from '@mui/material';
import constants from '../utilities/constants';

const db = firebase.firestore();

// Mock-up of mechanics data from Constants
const mechanics = constants.mechanics;
const mechanicIDs = mechanics.map(mech => mech.id);
const mechanicMap = mechanics.reduce((acc, mech) => {
  acc[mech.id] = mech
  return acc
});

const RepairOrdersPage = () => {
  const [groupedOrders, setGroupedOrders] = useState({});

  useEffect(() => {
    const fetchRepairOrders = async () => {
      const snapshot = await db.collection('repair_orders').where('complete', '==', false).get();
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Initial grouping of orders by existing mechanic assignment
      let mechanicLoad = mechanicIDs.reduce((acc, mechanic) => {
        acc[mechanic] = [];
        return acc;
      }, {});

      orders.forEach(order => {
        if (order.mechanic && mechanicIDs.includes(order.mechanic)) {
          mechanicLoad[order.mechanic].push(order);
        }
        else{
          order.mechanic = false;
        }
      });

      // Assign unassigned orders to balance the mechanic load
      const unassignedOrders = orders.filter(order => !order.mechanic);
      unassignedOrders.forEach(order => {
        const [leastBusyMechanic] = Object.entries(mechanicLoad).sort((a, b) => a[1].length - b[1].length)[0];
        order.mechanic = leastBusyMechanic;  // Assigning the mechanic to the order
        mechanicLoad[leastBusyMechanic].push(order);
        db.doc(`repair_orders/${order.id}`).set(order, {merge: true});
      });

      setGroupedOrders(mechanicLoad);
    };

    fetchRepairOrders();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Grid container sx={{ width: '100%', height: '100%' }}>
        <Grid item xs={3} sx={{ overflowY: 'auto', borderRight: '1px solid grey', height: '100%' }}>
          {Object.keys(groupedOrders).map(mechanicID => (
            <Typography key={mechanicID} sx={{ padding: 2, borderBottom: '1px solid grey' }}>
              {mechanicMap[mechanicID].name}
            </Typography>
          ))}
        </Grid>
        <Grid item xs={9} sx={{ overflow: 'auto', display: 'flex' }}>
          {Object.entries(groupedOrders).map(([mechanicID, orders]) => (
            <Box key={mechanicID} sx={{ minWidth: 300, margin: 1 }}>
              <Typography variant="h6" sx={{ marginBottom: 1 }}>{mechanicMap[mechanicID].name}</Typography>
              {orders.map(order => (
                <Card key={order.id} sx={{ margin: 1, padding: 2 }}>
                  <Typography>RO #{order.id}: {order.description}</Typography>
                </Card>
              ))}
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RepairOrdersPage;
