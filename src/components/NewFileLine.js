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

import { v4 as uuidv4 } from 'uuid';
// import { VideoConverter } from 'convert-video';



const buckets = {
  private: "skyway-dev-373d5.appspot.com",
  public: "skyway-dev-373d5"
}

const accept = {
  videos: 'video/*',
  images: 'image/*',
  pdf: '.pdf',
  imageLike: 'image/*,.pdf',
  docs: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv',
  all: "",
}

export default function NewFileLine(props) {
  const { folder, bucket = "private", saveLocation, allowable = "all", data = {} } = props;
  const activeBucket = buckets[bucket];

  const [loading, setLoading] = React.useState(false);
  const [fileLoaded, setFileLoaded] = React.useState(!!data[props.id]);
  const [filepath, setFilePath] = React.useState(data[props.id]);

  const {getRootProps, getInputProps} = useDropzone({
    multiple: !props.single,
    accept: accept[allowable],
    onDrop: async acceptedFiles => {
      acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setLoading(true);

      const baseFile = acceptedFiles[0];
      // const file = allowable === "videos" ? await convertVideo(baseFile)  : baseFile;
      const file = baseFile;
      const activeFolder = folder ? folder+"/" : "misc/";
      const activeID = data.id ? `${data.id}-${props.id}` : uuidv4();
      const filename = activeFolder+activeID+`.${getFileExtension(file.name)}`;
      const storageRef = firebase.app().storage(activeBucket).ref(filename);

      //Async update of file in order to imporve speed
      StateManager.setAlertAndOpen("Upload initiated!  You can navigate to other pages.", "info");
      StateManager.uploadFile({storageRef, file}).then(async result => {
        if(result){
          setFileLoaded(true);
          setFilePath(filename);

          if(saveLocation){
            const update = {[props.id]: filename};
            await firebase.firestore().doc(saveLocation).set(update, {merge: true}); 
            props.updater && props.updater(update);
          }
        } 
        setLoading(false);
      });
    }
  });

  const viewFile = async () =>{
    setLoading(true);
    if(!data[props.id]) return;
    let wfLink = document.createElement('a');
    wfLink.href = await firebase.app().storage(activeBucket).ref(filepath).getDownloadURL();
    wfLink.target = "_blank";
    wfLink.click();
    setLoading(false)
  }

  const deleteFile = async () => {
    setLoading(true);
    try{
      await firebase.app().storage(activeBucket).ref(data[props.id]).delete();
    }catch(e){
      console.log(e);
    }
    

    if(saveLocation){
      let update = {[props.id]: null};
      if(data[`${props.id}_status`]) update[`${props.id}_status`] = false;
      if(data[`${props.id}_date`]) update[`${props.id}_date`] = false;
      await firebase.firestore().doc(saveLocation).set(update, {merge: true});
      props.updater && props.updater(update);
    }
    
    setFileLoaded(false);
    setLoading(false);
  }

  const status = data[`${props.id}_status`] || false;
  const date = data[`${props.id}_date`] || false;
  const label = props.label + (status ? ` - ${status}` : "") + (date ? ` - ${date}` : "");

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      borderBottomWidth: '3px' 
    }}>
      <FormControlLabel control={props.removeCheck ? <></> : <Checkbox checked={fileLoaded} />} label={label} />
      {
        loading &&
        <CircularProgress />
      }
      {
        !fileLoaded && (
          !loading &&         
          <div style={{maxHeight: '40px', display:'flex', flexDirection:'row'}}>
            <section className="container">
              <div {...getRootProps({className: 'dropzone'})}>
                <input {...getInputProps()} />
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={props.disabled}
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
            {
              props.removeDelete ||
              <Button variant="contained" color="primary" onClick={deleteFile} disabled={props.disabled}>
                Delete
              </Button>
            }
          </div>
        )
      }
    </div>
  );
}

function getFileExtension(filename){
  // console.log(filename);
  const [name = "", ext = null] = filename.split(".");
  // var ext = /^.+\.([^.]+)$/.exec(filename);
  // console.log(ext)
  return !ext ? "" : ext;
}

// async function convertVideo(file) {
//   let sourceVideoFile = file;
//   let targetVideoFormat = 'mp4';
//   let convertedVideoDataObj = await VideoConverter.convert(sourceVideoFile, targetVideoFormat);
//   const newFile = new File([convertedVideoDataObj.blob], convertedVideoDataObj.name+".mp4", {type:"video/mp4"});
//   console.log(file, newFile);
//   return newFile;
// }
