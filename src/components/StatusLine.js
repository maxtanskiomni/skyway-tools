import React from 'react';
import Typography from '@mui/material/Typography';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import WarningIcon from '@mui/icons-material/Warning';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { IconButton } from '@mui/material';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';

import useStyles from '../utilities/styles.js';
import clsx from 'clsx';
import { StateManager } from '../utilities/stateManager.js';
import Blade from './Blade.js';

import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import firebase from '../utilities/firebase.js';


const buckets = {
  private: "skyway-dev-373d5.appspot.com",
  public: "skyway-dev-373d5"
}

const bucket = firebase.app().storage(buckets.public);
const baseURL = "https://cdn.skywayclassics.com/";


export default function StatusLine(props) {
  const {data={}, id="", updater=()=>null } = props;
  const classes = useStyles();

  const startCheck = data[id] !== "n/a";//data ? !!data[id] : false;
  const start_images = data[`${id}_images`] || [];
  const [check, setChecked] = React.useState(startCheck);
  const [expanded, setExpanded] = React.useState(false);
  const [status, setStatus] = React.useState(data[id] || "");
  const [fix, setFix] = React.useState(data[id+"-fix"] || "");
  const [description, setDescription] = React.useState(data[id+"-description"] || "");
  const [images, setImages] = React.useState(start_images);
  const [new_image_url, setNewImage] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const updateStatus = (stat) => {
    if(stat === status) stat = false;
    setStatus(stat);
    updater("inspections", {[id]: stat});
  }

  const updateFix = (e) => {
    const {value} = e.target;
    setFix(value);
    updater("inspections", {[id+"-fix"]: value});
  }

  const updateDescription = (e) => {
    const {value} = e.target;
    setDescription(value);
    updater("inspections", {[id+"-description"]: value});
  }
  
  const onCheck = () => {
    if(check) updater("inspections", {[id]: "n/a"});
    else updater("inspections", {[id]: status});
    setChecked(!check);
  }

  const makeRepair = () => {
    StateManager.setAlertAndOpen("Repair created!", "success");
  }

  React.useEffect(() => {
    if(!new_image_url) return false
    console.log(images, new_image_url)
    //Conbine all photo urls
    const new_images = [...images, new_image_url];

    //Update firebase with new image references
    updater("inspections", {[`${id}_images`]: new_images});

    //Update state with new url array
    setImages(new_images);
  }, [new_image_url]);

  const addImage = async (img) => {
    const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = new Buffer.from(base64Data, 'base64');
    const fileType = 'image/jpeg'; // Set the expected MIME type for the output
    const blob = new Blob([imageBuffer], { type: fileType });
    

    //Compression of image
    try{
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: fileType };
      const compressed = await imageCompression(blob, options);

      //Make the reference and upload the file
      const activeFolder = "inspection_photos/";
      const activeID = uuidv4();
      const filename = activeFolder+activeID+`.jpg`;
      const storageRef = bucket.ref(filename);
      await storageRef.put(compressed);

      //Update state with image new url 
      setNewImage(baseURL+filename);
    }
    catch(e){
      console.log(e);
    }
  }
  

  const toggleCamera = () => {
    StateManager.toggleCamera();
    StateManager.photoHandler = addImage
  }


  const updateYellow = () => {
    const new_status="orange"
    updateStatus(new_status)
    if(status !== new_status) {
      handleExpandClick();
      toggleCamera();
    }
  }


  const updateRed = () => {
    const new_status="red"
    updateStatus(new_status)
    if(status !== new_status) {
      handleExpandClick();
      toggleCamera();
    }
  }

  const deleteImage = async (i) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      //filter out the target URL
      const new_images = [...images.filter((image, index) => index !== i)];

      //Update firebase with new image references
      updater("inspections", {[`${id}_images`]: new_images});

      //Update state with new url array
      setImages(new_images);
      // StateManager.setLoading(true);
    }
  }

  return (
    <div style={{ backgroundColor: 'white', }}>
      <div style={{
        backgroundColor: 'white', 
        padding: '17px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottomWidth: '3px' 
      }}>
        <FormControlLabel control={<Checkbox checked={check} onClick={onCheck} />} label={props.label} />
        <div style={{display: "flex"}}>
          {
            check && 
            <>
              <IconButton
                onClick={() => updateStatus("green")}
                style={{color: status === "green" ? "#27cc53" : ""}}
                size="large">
                <ThumbUpIcon />
              </IconButton>
              <IconButton
                onClick={updateYellow}
                style={{color: status === "orange" ? "#FFAA00" : ""}}
                size="large">
                <WarningIcon />
              </IconButton>
              <IconButton
                onClick={updateRed}
                style={{color: status === "red" ? "red" : ""}}
                size="large">
                <ThumbDownIcon />
              </IconButton>
            </>
          }
          <IconButton
            className={clsx(classes.expand_no_padding, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
            size="large">
            <ExpandMoreIcon />
          </IconButton>
        </div>
      </div>
      <Blade 
        open={expanded}
        onClose={handleExpandClick}
        title={props.label}
      >
        <div style={{ margin: 30, }}>
          {props.children}
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", margin: "30px 0" }}>
          <TextField
            label="Issue Description"
            multiline
            maxRows={4}
            value={description}
            onChange={updateDescription}
            variant="outlined"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Suggested Fix"
            multiline
            maxRows={4}
            value={fix}
            onChange={updateFix}
            variant="outlined"
            fullWidth
            margin="normal"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", margin: 30, alignItems: "center", justifyContent: "center", overflowX: "scroll", overflowY: "scroll"}}>
          <div onClick={toggleCamera} style={{width: "100%", display:"flex", flexDirection: "row", alignItems: "center", justifyContent: "center"}}>
            Add Photos
            <IconButton onClick={toggleCamera}>
              <PhotoCameraIcon />
            </IconButton>
          </div> 

          <div style={{ display: "flex", flexDirection: "column", margin: 30,}}>
            {
              images.map((image, index) => 
                <div style={{maxHeight:120, margin: "5px"}}>
                  <div onClick={() => deleteImage(index)} style={delteButton}>X</div>
                  <a href={image} target="_blank">
                    <img style={{maxHeight:120}} src={image} />
                  </a>
                </div>
              )
            }
          </div>
        </div>
      </Blade>
    </div>
  );
}


const delteButton = {
  position: "relative",
  left: "0%",
  top: "20%",
  color: "white",
  background: "gray",
  width: "24px",
  height: "24px",
  textAlign: "center",
  padding: "3px",
  verticalAlign: "middle",
  cursor: "pointer",
}
