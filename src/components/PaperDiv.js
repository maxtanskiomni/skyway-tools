import React from 'react';


export default function PaperDiv(props) {

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px',
      marginBottom: 10 
    }}>
      {props.children}
    </div>
  );
}
