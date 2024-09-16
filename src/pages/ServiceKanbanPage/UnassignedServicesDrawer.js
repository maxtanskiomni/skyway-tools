import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ServiceCard from '../../components/ServiceCard';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';

const UnassignedServicesDrawer = ({ open, services, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Style for the drawer and cards
  const drawerStyle = {
    height: '100%',
    overflow: 'auto',
    // position: 'fixed',
    display: "flex",
    flexDirection: "column",
    bottom: 0,
    // width: '25%',
    minWidth: 250,
    backgroundColor: "#EEEEEE",
    alignItems: "center"
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => {
    return Object.values(service).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(searchTerm.toLowerCase().trim()), false)
            || Object.values(service.order).filter(x => typeof x === "string").reduce((a,c) => a || c.toLowerCase().includes(searchTerm.toLowerCase().trim()), false);
  });

  return (
    <Drawer anchor="left" open={open} onClose={onClose} ModalProps={{ keepMounted: true, }}>
      <div style={drawerStyle}>
        <h2>Unassigned Services</h2>
        <p style={{width: 250, textAlign: "center"}}>Services listed here are only for SOs that have been approved and are in the working status</p>
        <Paper style={{ padding: 8, margin: 8, width: '90%' }}>
          <TextField 
            label="Search Services" 
            variant="outlined"
            fullWidth
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Paper>
        <List style={{width: "100%"}}>
          {filteredServices.length <= 0 ? <h3>No services to assign</h3> : ""}
          {filteredServices.map((service, index) => (
            <ListItem key={index}>
              <ServiceCard {...service} type="service" object_key="id"/>
            </ListItem>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default UnassignedServicesDrawer;
