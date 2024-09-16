import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SimpleTable from '../../components/SimpleTable';
import IconButton from '@mui/material/IconButton';
import { Delete } from '@mui/icons-material';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Funding(props) {
  const { stockNumber } = props;
  const [loading, setLoading] = React.useState(true);
  const [tableData, setData] =React.useState({});
  const [lightboxOpen, setOpen] =React.useState(false);
  const [lightboxURL, setImage] =React.useState('');
  const [open, setOpenAlert] = React.useState(false);
  const [severity, setSeverity] = React.useState('error');

  const closeLightbox = () => {
    setOpen(false);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };

  React.useEffect(() => {
    async function fetchTransactions() {
      const db = firebase.firestore();
      const transactionSnapshot = await db.collection('deposits').where('stock', '==', stockNumber).get();

      const deleteRow = async (id) => {
        setLoading(true)
        await firebase.firestore().collection('deposits').doc(id).delete();
        await fetchTransactions()
      }

      const deleteButton = (id) => (
        <IconButton
          aria-label="add-link"
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            deleteRow(id)
            }}
          size="large">
          <Delete />
        </IconButton>
      )

      const showFile = async (fileLocation) => {
        if(!fileLocation){
          setOpenAlert(true)
          return false
        }
        const storage = firebase.storage();
        const url = await storage.ref(fileLocation).getDownloadURL();
        setImage(url)
        setOpen(true)
      }

      const promises = transactionSnapshot.docs.map( 
        async doc => {
          const data = doc.data() || {};
          return {
            id: doc.id, 
            ...data,
            actions: deleteButton(doc.id),
            rowAction: () => showFile(data.files ? data.files[0] : false)
          }
        }
      );

      const rows = await Promise.all(promises)
      const summary = {format: 'usd', label: 'Total', value: rows.reduce((a,c) => a + c.amount, 0)};

      setLoading(false);
      setData({
        rows,
        summary,
        headers: [{key:'date', label:'Date'}, {key:'memo', label:'Memo'}, {key:'amount', label:'Amount', format:'usd'}, {key:'actions', label:'Actions'}],
        title: 'Vehicle deposits', 
      });
    }
    fetchTransactions();
  }, [stockNumber]);

  const onClick = (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");
    history.push(`/form/car-deposits?stock=${stockNumber}&redirect=${redirect}&tab=${tab}`)
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          {
            loading 
              ? <CircularProgress />
              : <SimpleTable {...tableData}/>
          }
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={onClick}>
          Add Deposit
        </Button>
      </Grid>
      {
        lightboxOpen && (
          <Lightbox
            medium={lightboxURL}
            large={lightboxURL}
            alt="Image Preview"
            onClose={closeLightbox}
          />
        )
      }
      <Snackbar open={open} autoHideDuration={2000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={severity}>
          This deposit does not have a saved receipt
        </Alert>
      </Snackbar>
    </Grid>
  );
}
