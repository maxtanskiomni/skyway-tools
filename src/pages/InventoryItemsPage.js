import React, { useState, useEffect } from 'react';
import firebase from '../utilities/firebase';
import { QRCode } from 'react-qr-code';
import { TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Paper, CircularProgress, Modal } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const db = firebase.firestore();

function InventoryPage() {
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [inventory, setInventory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [openModal, setOpenModal] = useState(false); // Modal open state

    useEffect(() => {
        const unsubscribe = db.collection('inventory-entries')
            .orderBy('timestamp', 'desc')
            .limit(30)
            .onSnapshot(snapshot => {
                setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            });
        
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('inventory-entries').add({ name, quantity: +quantity, cost: +cost, timestamp });
        setName('');
        setQuantity('');
        setCost('');
    };

    const handlePrint = () => {
      const printContent = document.getElementById('print-content');
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Print</title></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    };

    const handleItemDelete = async (id) => {
      await db.collection('inventory-entries').doc(id).delete();
    };

    const handleOpenModal = (item) => {
        setSelectedItem(item);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    // Modal style
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '24',
        borderRadius: '4px',
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    };

    return (
        <div>
            <Typography variant="h3" gutterBottom>Inventory Page</Typography>
            <Paper style={{margin: 15, padding: 15}}>
              <Typography variant="h4" gutterBottom>Add Inventory</Typography>
              <div>
                  <TextField
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      margin="normal"
                      variant="outlined"
                  />
                  <TextField
                      label="Quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      margin="normal"
                      variant="outlined"
                  />
                  <TextField
                      label="Cost"
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      margin="normal"
                      variant="outlined"
                  />
              </div>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                  Add to Inventory
              </Button>
            </Paper>

            <Paper style={{margin: 15}}>
              <Typography variant="h4" gutterBottom>Inventory Entries</Typography>
              <List>
                  {loading && <CircularProgress />}
                  {inventory.length <= 0 && !loading && <Typography variant="p" gutterBottom>No entires yet</Typography> }
                  {inventory.map(item => (
                      <ListItem key={item.id} button onClick={() => handleOpenModal(item)}>
                          <ListItemText 
                              primary={item.name} 
                              secondary={`Quantity: ${item.quantity}, Cost: ${item.cost}`}
                          />
                          <ListItemSecondaryAction>
                              <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => handleItemDelete(item.id)}
                                  size="large">
                                  <DeleteIcon />
                              </IconButton>
                          </ListItemSecondaryAction>
                      </ListItem>
                  ))}
              </List>
            </Paper>

            <Modal open={openModal} onClose={handleCloseModal}>
              <div style={modalStyle}>
                  <PrintContent selectedItem={selectedItem} />
                  <Button variant="contained" onClick={handlePrint}>
                      Print
                  </Button>
              </div>
          </Modal>
        </div>
    );
}

function PrintContent({ selectedItem }) {
  return (
      <div id="print-content">
          {selectedItem && (
              <div>
                  <QRCode value={`https://tools.skywayclassics.com/assign-part/${selectedItem.id}`} />
                  <Typography variant="body1">Name: {selectedItem.name}</Typography>
                  <Typography variant="body1">Quantity: {selectedItem.quantity}</Typography>
                  <Typography variant="body1">Cost: {selectedItem.cost}</Typography>
              </div>
          )}
      </div>
  );
}

export default InventoryPage;
