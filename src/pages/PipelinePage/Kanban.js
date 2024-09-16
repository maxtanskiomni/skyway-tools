import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import CarCard from '../../components/CarCard';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import moment from 'moment';

import Board, { moveCard } from "@asseinfo/react-kanban";
import "@asseinfo/react-kanban/dist/styles.css";

export default function Kanban(props) {
  const { status = "status", filter = "sold", stages = constants.statuses.slice(0, -4) } = props;
  const [board, setBoard] = React.useState({columns: []});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const snap = await db.collection('cars')
                                .where(status, '!=', filter)
                                .get();

      let cars = snap.docs.map(doc => ({...doc.data(), id: doc.id, type: status}));
      cars = cars.sort((a,b) => a.stock >= b.stock);
      
      const columns = stages.map(x => {
        const cards = cars.filter(car => car[status] == x).map(mapCarToCard);
        const count = cards.length;
        const times = cards.map(({content}) => moment().diff(content[status+"_time"], 'days')).filter(x => x>0);
        const averageTime = Math.round(times.reduce((a, b) => a + b, 0) / (times.length || 1));

        return {
          id: x,
          title: x.charAt(0).toUpperCase() + x.substring(1).toLowerCase() + `: ${count} cars - ${averageTime} days `,
          backgroundColor: "#fff",
          cards,
        }
      })
    
      const board = {
        columns
      };
      setBoard(board);
      console.log('done');
      setLoading(false);
    }
    fetchData();
  }, []);

  const updateCard = async (columns, card, source, destination) => {
    const status_time = moment().format("YYYY/MM/DD");
    const data = {[status]: destination.toColumnId, [status+"_time"]: status_time};
    await firebase.firestore().collection('cars').doc(card.id).set(data, {merge:true});
  }

  return (
    loading
    ? <CircularProgress />
    : (
      <div>
        <Board
          disableColumnDrag
          initialBoard={board}
          renderCard={({ content }, { dragging }) => (
            <CarCard dragging={dragging} {...content}/>
          )}
          onCardDragEnd={updateCard}
        />
      </div>
    )
  );
}

const mapCarToCard = car => ({
  id: car.stock,
  title: `${car.stock}`,
  description: `${car.year} ${car.make} ${car.model}`,
  content: {...car, title: `${car.stock} ${car.year} ${car.model}`}
});
