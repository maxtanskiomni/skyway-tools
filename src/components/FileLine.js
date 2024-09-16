import React from 'react';
import Typography from '@mui/material/Typography';
import {useDropzone} from 'react-dropzone';
import firebase from '../utilities/firebase.js';
import CircularProgress from '@mui/material/CircularProgress';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Preview from './Preview';
import Store from '../utilities/store.js';
import IconButton from '@mui/material/IconButton';
import { Add, Link, Search } from '@mui/icons-material';
import { StateManager } from '../utilities/stateManager.js';


export default function FileLine(props) {
  const [loading, setLoading] = React.useState(false);
  const [fileLoaded, setFileLoaded] = React.useState(!!props.data[props.id]);
  const [filepath, setFilePath] = React.useState(props.data[props.id]);

  const {getRootProps, getInputProps} = useDropzone({
    multiple: !props.single,
    onDrop: async acceptedFiles => {
      acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setLoading(true);
      const file = acceptedFiles[0];
      const filename = 'titles/'+props.id + "_" + props.data.stock;
      const storageRef = firebase.storage().ref(filename);
      await storageRef.put(file);
      await firebase.firestore().doc("cars/"+props.data.stock).set({
        [props.id]: filename,
        ['is_'+props.id]: true,
      }, {merge: true});
      setFilePath(filename);
      setFileLoaded(true);
      setLoading(false);
    }
  });

  const viewFile = async () =>{
    setLoading(true);
    if(!props.data[props.id]) return;
    let wfLink = document.createElement('a');
    wfLink.href = await firebase.storage().ref(filepath).getDownloadURL();
    wfLink.target = "_blank";
    wfLink.click();
    setLoading(false)
  }

  const deleteFile = async () => {
    setLoading(true);
    await firebase.storage().ref(props.data[props.id]).delete()
    await firebase.firestore().doc("cars/"+props.data.stock).set({
      [props.id]: null,
      ['is_'+props.id]: false,
    }, {merge: true});
    setFileLoaded(false);
    setLoading(false);
  }

  const getFileSendLink = async () => {
    navigator.clipboard.writeText('https://admin.skywayclassics.com/form/upload-title?stock='+`${props.data.stock}`);
    StateManager.setAlertAndOpen("Link Copied", "success");
  }

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={<Checkbox checked={fileLoaded} />} label={props.label} />
      {
        loading &&
        <CircularProgress />
      }
      {
        !fileLoaded && (
          !loading &&         
          <div style={{maxHeight: '40px', display:'flex', flexDirection:'row'}}>
            <IconButton
              onClick={getFileSendLink}
              aria-label="add-link"
              color="secondary"
              size="large">
              <Link />
            </IconButton>
            <section className="container">
              <div {...getRootProps({className: 'dropzone'})}>
                <input {...getInputProps()} />
                  <Button
                    variant="contained"
                    color="primary"
                  >
                    Upload
                  </Button>
              </div>
            </section>
          </div>
        )
      }
      {
        fileLoaded && (
          !loading && 
          <div style={{maxHeight: '40px', display:'flex', flexDirection:'row'}}>
            <Button variant="contained" color="secondary" onClick={viewFile}>
              View
            </Button>
            <Button variant="contained" color="primary" onClick={deleteFile}>
              Delete
            </Button>
          </div>
        )
      }
    </div>
  );
}
