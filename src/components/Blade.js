import React, { useState, useRef, forwardRef } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';


const Blade = forwardRef((props, ref) => {
  const { open, onClose, title = "" } = props;

  // Style for the drawer and cards
  const drawerStyle = {
    height: '100vh',
    overflow: 'auto', 
    display: "flex",
    flexDirection: "column",
    width: {
      xs: '100%',
      sm: '90%',
      md: '85%',
      lg: '80%',
      xl: '75%'
    },
    minWidth: {
      xs: 320,
      sm: 500,
      md: 700,
      lg: 900,
      xl: 1000,
    },
    maxWidth: {
      xs: '100vw',
      sm: 1200,
      md: 1400,
      lg: 1600,
      xl: 1800,
    },
    backgroundColor: "#FFFFFF",
    alignItems: "stretch",
    padding: {
      xs: '24px 16px',
      sm: '32px 24px',
      md: '40px 32px'
    },
    boxSizing: 'border-box'
  };

  const paperProps = {
    sx: {
      width: {
        xs: '100%',  // Full width on mobile
        sm: '600px', // Fixed widths for larger screens
        md: '600px',
        lg: '600px',
        xl: '600px'
      },
      maxWidth: '100%', // Ensure it never exceeds screen width
      // position: 'relative'
    }
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    marginBottom: 2,
    position: 'sticky',
    top: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1
  };

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose} 
      ModalProps={{ 
        keepMounted: true,
        sx: { zIndex: 1300 }
      }}
      PaperProps={{
        ...paperProps,
        sx: {
          ...paperProps.sx,
          zIndex: 1300
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          zIndex: 1300
        }
      }}
    >
      <div style={drawerStyle} ref={ref} id="drawer-container">
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <IconButton 
            onClick={onClose}
            aria-label="close blade"
            sx={{ marginLeft: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </div>
        {open ? props.children : <></>}
      </div>
    </Drawer>
  );
});

export default Blade;
