import React from 'react';
import Typography from '@mui/material/Typography';
import {useDropzone} from 'react-dropzone';
import firebase from '../utilities/firebase.js';
import CircularProgress from '@mui/material/CircularProgress';
import imageCompression from 'browser-image-compression';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Preview from './Preview';
import Store from '../utilities/store.js';
import IconButton from '@mui/material/IconButton';
import { Add, Link, Search } from '@mui/icons-material';
import { StateManager } from '../utilities/stateManager.js';

import { v4 as uuidv4 } from 'uuid';

const buckets = {
  private: "skyway-dev-373d5.appspot.com",
  public: "skyway-dev-373d5"
}

const baseURL = "https://cdn.skywayclassics.com/";

export default function UploadLine(props) {
  const { folder, bucket = "private", multiple = true } = props;
  const activeBucket = buckets[bucket];
  const [loading, setLoading] = React.useState(false);

  const {getRootProps, getInputProps} = useDropzone({
    multiple,
    onDrop: async acceptedFiles => {
      // console.log(acceptedFiles);
      if(!props.disable_loading) StateManager.setLoading(true);
      else {
        StateManager.setAlertAndOpen("Save save started", "info");
        setLoading(true);
      }

      acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));

      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920};
      let locations = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        let file = acceptedFiles[i];

        //Compression of image
        try{
          const compressed = await imageCompression(file, options);
          file = compressed;
        }catch(e){
          console.log(e);
        }
        
        const activeFolder = "" + (folder ? folder+"/" : "");
        const activeID = props.id || uuidv4();
        const filename = activeFolder+activeID+`.${getFileExtension(file.name)}`;
        const storageRef = firebase.app().storage(activeBucket).ref(filename);
        await storageRef.put(file);
        locations.push(baseURL+filename);
      }
      props.callback && (await props.callback(locations));

      if(!props.disable_loading) StateManager.setLoading(false);
      else {
        StateManager.setAlertAndOpen("Saved Success!", "success");
        setLoading(false);
      }
    }
  });


  return (
    <div style={{maxHeight: '40px', width: "100%"}}>
      <section className="container">
        {loading && props.disable_loading && <CircularProgress color="inherit" />}
        <div {...getRootProps({className: 'dropzone'})}>
          <input {...getInputProps()} />
          <Button variant="contained" color="primary">
            {props.cta || "Select Pictures"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function getFileExtension(filename){
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}
