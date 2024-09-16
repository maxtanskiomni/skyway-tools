import React from 'react';

import './App.css';
import data from './config.js';

import useWindowSize from './utilities/useWindowSize.js';
import useStyles from './utilities/styles.js';

import Card from './componets/Card';
import PickerDialog from './componets/PickerDialog';

import Board, { addCard } from '@lourenci/react-kanban';
import '@lourenci/react-kanban/dist/styles.css';

//FAB
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

function App() {

  const [open, setOpen] = React.useState(false);

  const renderCard = (card) => (<Card {...card} />)

  const size = useWindowSize();

  const classes = useStyles();

//Start board component
  const board = data.board;
  const handleFABClick = () => addCard({ board, inColumn: 1, card: {id: 99, title: 'New Card'}, on:'top' });//setOpen(!open);

  return (
    <div className="App" style={{width: size.width, height: size.height}}>
      <Board
        style={{width: size.width, height: size.height}}
        renderCard={renderCard}
        initialBoard={board}
        allowAddCard={{ on: 'top' }}
        onNewCardConfirm={onCardNew} 
        onCardNew={console.log}
      />
      <Fab style={{position: 'absolute', bottom: '25px'}} color="primary" aria-label="add">
        <AddIcon onClick={handleFABClick} />
      </Fab>
      <PickerDialog
        classes={{
          paper: classes.paper,
        }}
        id="add-button"
        keepMounted
        open={open}
        onClose={handleFABClick}
      />
    </div>
  );
}

function onCardNew (newCard) {
  newCard = { id: newCard.stockNumber, ...newCard };
  return newCard;
}

export default App;
