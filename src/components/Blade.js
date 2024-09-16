import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';


const Blade = (props) => {
  const { open, onClose, title = "" } = props;

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
    alignItems: "center",
    padding: 25
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} ModalProps={{ keepMounted: true, }}>
      <div style={drawerStyle}>
        <h2>{title}</h2>
        {open ? props.children : <></>}
      </div>
    </Drawer>
  );
};

export default Blade;
