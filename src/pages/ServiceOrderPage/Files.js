import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';

import IconButton from '@mui/material/IconButton';
import { Delete, Receipt } from '@mui/icons-material';
import { StateManager } from '../../utilities/stateManager';

const tableSettings = {
  headers: [
    {key:'date', label:'Date'},
    {key:'name', label:'File Name'}, 
    {key:'actions', label:''}, 
  ],
  title: '', 
};

export default function Files(props) {
  const { order } = props;
  const stockNumber = order.stock
  const [files, setFiles] = React.useState(order.files || []);
  const [tableData, setData] = React.useState({});

  React.useEffect(() => {
    const rows = files.map(file => {
        return {
          ...file,
          actions: DeleteButton(file.id),
          // rowAction: () => downloadFile(file.id) //edit file
        }
    });
  
    setData({
      rows,
      ...tableSettings,
    });
  }, [files])

  const deleteRow = async (id) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      StateManager.setLoading(true);
      await firebase.firestore().collection('files').doc(id).delete();
      const newFiles = files.filter(x => x.id !== id);
      setFiles(newFiles);
      StateManager.setLoading(false);
    }
  }

  const downloadFile = async id => {
    let link = document.createElement('a');
    link.href = await firebase.storage().ref(`files/${id}`).getDownloadURL();
    link.target = "_blank";
    link.click();
  } 

  const DeleteButton = (id) => (
    <>
      <IconButton
        aria-label="add-link"
        color="secondary"
        onClick={(e) => {
            e.stopPropagation();
            downloadFile(id)
          }}
        size="large">
        <Receipt />
      </IconButton>
      <IconButton
        aria-label="add-link"
        color="primary"
        onClick={(e) => {
            e.stopPropagation();
            deleteRow(id)
          }}
        size="large">
        <Delete />
      </IconButton>
    </>
  );

  const addFile = () => {
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");

    const destination = `/form/files?stock=${stockNumber}&redirect=${redirect}&tab=${tab}`;
    history.push(destination);
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
      <Grid item xs={12}>
        {/* <Button variant="contained" color="secondary" onClick={() => null}>
          Get link
        </Button> */}
        <Button variant="contained" color="primary" onClick={addFile}>
          Add file
        </Button>
      </Grid>
    </Grid>
  );
}
