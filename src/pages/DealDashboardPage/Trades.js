import React from 'react';
import Grid from '@mui/material/Grid';
import SimpleTable from '../../components/SimpleTable';


export default function Trades(props) {
  const { rows } = props;
  let trades = rows
    .filter(x => x.trades.length > 0)
    .map(x => x.trades.map(trade => ({
                ...trade, 
                tradeTitle: `${trade.year || ""} ${trade.make || ""} ${trade.model || ""}`,
                carTitle: x.carTitle,
                rowLink: `../car/${x.stock}`,
              })));
  trades = trades.flat();
  console.log(trades)

  const summary = [
    {format: 'usd', label: 'Total Trade Amount', value: trades.reduce((a,c) => a + c.netTrade, 0)},
  ];

  const tableData = {
    rows: trades,
    summary,
    headers: [
      {key:'stock', label:'Stock Number'}, 
      {key:'carTitle', label:'Deal Car'},
      {key:'tradeTitle', label:'Trade'},
      {key:'vin', label:'VIN'},
      {key:'trade', label:'Value', format:'usd'}, 
      {key:'netTrade', label:'Net Value', format:'usd'}, 
    ],
    title: '', 
  };


  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
    </Grid>
  );
}


// const trades = await Promise.all(tradeSnaps);
// const tradeDocs = trades.map(snap => snap.docs);

// const promises = tradeDocs.flat().map( 
//   async (doc, i) => {
//     console.log(doc)
//     const data = doc.data()
//     const carSnap = await db.doc('cars/'+data.stock).get();
//     const car = carSnap.exists ? carSnap.data() : {};

//     return {
//       ...data,
//       date: data.date,
//       car: `${data.year || ''} ${data.model || ''}`,
//       deal_car: `${car.year || ''} ${car.model || ''}`,
//       id: doc.id, 
//       rowLink: `../car/${data.stock}`, //TODO: Make link go to trade page
//     }
//   }
// );

