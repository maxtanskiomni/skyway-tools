import React, { useState, useEffect } from 'react';
import firebase from '../utilities/firebase.js';
import history from '../utilities/history.js';
import { Select, MenuItem, Button, Typography, Paper, CircularProgress } from '@mui/material';
import moment from 'moment/moment.js';

const db = firebase.firestore();

function AssignInventoryPage(props) {
    const { entryID = "" } = props.match.params;
    
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState('');
    const [serviceOrders, setServiceOrders] = useState([]);
    const [part, setPart] = useState('');

    useEffect(() => {
        if(entryID) {
            db.collection('inventory-entries').doc(entryID).get().then(doc => {
                if(doc.exists) {
                    setPart(doc.data());
                }
                setLoading(false);
            });
        }

        const unsubscribe = db.collection('orders')
            .where('status', '==', 'working')
            .onSnapshot(snapshot => {
                const ordersData = snapshot.docs.map(doc => {
                    const order = doc.data() || {};
                    return ({
                        id: doc.id,
                        name: doc.id,
                        order
                    })
                });
                // setServiceOrders([{ id: 'ss', name: 'Shop Expense' }, ...ordersData]);
                setServiceOrders(ordersData);
            });

        return () => unsubscribe();
    }, [entryID]);

    const handleSelectionChange = (event) => {
        setSelectedOrder(event.target.value);
    };

    const handleSubmit = async () => {
        if (selectedOrder) {
            setLoading(true);
            const ref = db.collection('purchases').doc()
            const amount = Math.round(100*(part.cost/part.quantity))/100;
            const isPayable = false;
            const memo = part.name;
            const paidDate = moment().format("YYYY/MM/DD");
            const date = moment().format("YYYY/MM/DD");
            const stock = selectedOrder;
            const vendor = "Inventory";
            const id = ref.id
            
            await ref.set({ 
                amount,
                isPayable,
                memo,
                paidDate,
                date,
                stock,
                vendor,
                id
             });

            history.push(`/service-order/${selectedOrder}?tab=purchases`);
        }
    };

    if(loading) {
        return <CircularProgress />;
    }

    return (
        <div>
            <Typography variant="h3" gutterBottom>Assign Part</Typography>
            <Paper style={{margin: 15, padding: 15}}>
                <Typography variant="h4" gutterBottom>Select Account for Part: {part.name || ""}</Typography>
                <div>
                    <Select
                        labelId="service-order-select-label"
                        id="service-order-select"
                        value={selectedOrder}
                        onChange={handleSelectionChange}
                        style={{ margin: '8px 0', width: '100%' }}
                    >
                        {serviceOrders.map((order) => (
                            <MenuItem key={order.id} value={order.id}>{order.name}</MenuItem>
                        ))}
                    </Select>
                </div>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Assign Part
                </Button>
            </Paper>
        </div>
    );
}

export default AssignInventoryPage;
