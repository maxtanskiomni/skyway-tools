import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Customers from './Customers.js';
import DateSelector from './DateSelector.js';
import Trades from './Trades';
import Invoices from './Invoices.js';
import ExpensesSummary from './ExpensesSummary.js';
import ProfitSummary from './ProfitSummary.js';
import DMVSummary from './DMVSummary.js';
import FileBank from './FileBank.js';
import Paperwork from './Paperwork.js';
import SimpleTable from '../../components/SimpleTable';
import Header from '../../components/Header';
import firebase from '../../utilities/firebase';
import { getFunctions, httpsCallable } from "firebase/functions";
import history from '../../utilities/history';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextLine from '../../components/TextLine.js';
import { StateManager } from '../../utilities/stateManager.js'

import Preview from '../../components/Preview.js';
import moment from 'moment';
import Dropdown from '../../components/Dropdown.js';

import UploadLine from '../../components/UploadLine.js';
import { TextField } from '@mui/material';
import NewFileLine from '../../components/NewFileLine.js';
import algolia from '../../utilities/algolia.js';
import RequestManager from '../../utilities/requestManager.js';

export default function Marketing(props) {
  const { car = {} } = props;

  const sections = {
    'cover': <PictureSection id="thumbnail" multiple={false} {...car}/>,
    'vin': <PictureSection id="vin_image" multiple={false} {...car}/>,
    'odometer': <PictureSection id="odometer_image" multiple={false} {...car}/>,
    'stamping': <PictureSection id="stamping_images" {...car}/>,
    'exterior': <PictureSection id="ext_images" {...car}/>,
    'interior': <PictureSection id="interior_images" {...car}/>,
    'engine-bay': <PictureSection id="engine_images" {...car}/>,
    'undercarriage': <PictureSection id="under_images" {...car}/>,
    'videos': <VideoSection {...car}/>,
    // 'write-up': <WriteupSection {...car}/>,
  };

  const refresh = async () => {
    StateManager.setAlertAndOpen("Refreshing in background", "info");
    const params = {
      function: "refreshImages",
      variables: {
        stock: car.stock,
      }
    };
    let response = await RequestManager.get(params);
    StateManager.setAlertAndOpen("Pictures refreshed!");
  }

  return (
    <div style={{paddingBottom: 15}}>
      <>
        <Button variant="contained" color="primary" onClick={refresh}>
          Refresh DA Pictures
        </Button>
      </>
      {
        Object.keys(sections).map((section, i) => 
            <>
              <Typography variant={"h5"} align="left" style={{padding: 7}}>
                {StateManager.formatTitle(section)}
              </Typography>
              {sections[section]}
            </>
        )
      }
    </div>
  );
}

const delteButton = {
  position: "relative",
  left: "3%",
  top: "15%",
  color: "white",
  background: "gray",
  width: "24px",
  height: "24px",
  textAlign: "center",
  padding: "3px",
  verticalAlign: "middle",
  cursor: "pointer",
}

const PictureSection = (props) => {
  const { images = undefined, stock, id = "images", multiple = true }= props;
  let default_data = props[id];
  if(!Array.isArray(default_data)) default_data = [default_data].filter(x => x);
  const x = images || default_data;
  const [pics, setPics] = React.useState(x);
  const dragItem = React.useRef();
  const dragOverItem = React.useRef();

  const fileUploader = async (files) => {
    let update = multiple 
      ? {[id]: firebase.firestore.FieldValue.arrayUnion(...files)}
      : {[id]: files[0]};

    await firebase.firestore().doc("cars/"+stock).set({...update, picsRefreshed: true}, {merge: true});
    if(id == "thumbnail") await algolia.updateRecord("cars", {...update, objectID: stock});
    setPics([...(multiple ? pics : []), ...files]);
  };

  const dragStart = (e, position) => {
    dragItem.current = position;
    console.log(e.target.src);
  }

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
    console.log(e.target.src);
  };

  const drop = (e) => {
    const copyListItems = [...pics];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setPics(copyListItems);
    firebase.firestore().doc("cars/"+stock).set({[id]: copyListItems, picsRefreshed: true}, {merge: true});
  };

  const deleteImage = async (i) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      StateManager.setLoading(true);
      let copyListItems = multiple ? [...pics.filter((image, index) => index !== i)] : null;
      await firebase.firestore().doc("cars/"+stock).set({[id]: copyListItems, picsRefreshed: true}, {merge: true});
      setPics(multiple ? copyListItems : []);
      StateManager.setLoading(false);
    }
  }

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      flexDirection: "column",
      borderBottomWidth: '3px' 
    }}>
      <div style={{padding: "17px", display: 'flex', justifyContent: 'center',flexDirection: "row", flexWrap: "wrap"}}>
        {
          pics.map((image, index) => (
            <div 
              key={index} 
              draggable 
              onDragStart={e => dragStart(e, index)}
              onDragEnter={(e) => dragEnter(e, index)}
              onDragEnd={drop}
            >
              <div onClick={() => deleteImage(index)} style={delteButton}>X</div>
              <CarImage image={image} />
            </div>
          ))
        }
      </div>     
      <UploadLine folder="images" bucket="public" multiple={multiple} disable_loading callback={fileUploader}/>
    </div>
  );
}

const CarImage = (props) => (
  <div style={{padding:"7px"}} >
    <a href={`${props.image}`} target="_blank">
      <img src={`${props.image}`} style={{width: 220, height: 166.6667}}/>
    </a>
  </div>
)

const VideoSection = (props) => {

  const publish = async () => {
    StateManager.setLoading(true);
    const params = {
      function: "mergeVideos",
      variables: {
        stock: props.stock,
      }
    };
    let response = await RequestManager.get(params);
    await updater("youtube_link", response.video);
    StateManager.setLoading(false);
    StateManager.setAlertAndOpen("Video Saved!");
  }

  const updater = (id, value) => firebase.firestore().doc('cars/'+props.stock).set({[id]: value, needsDAUpdate: true}, {merge: true});

  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '17px', 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      flexDirection: "column",
      borderBottomWidth: '3px' 
    }}>
      <NewFileLine id="walkaround_video" label="Walk Around Video" allowable="videos" folder="videos" bucket="public" saveLocation={`cars/${props.stock}`} data={props} />
      <NewFileLine id="engine_video" label="Engine Bay Video" allowable="videos" folder="videos" bucket="public" saveLocation={`cars/${props.stock}`} data={props} />
      <NewFileLine id="convertible_video" label="Convertible Top Video" allowable="videos" folder="videos" bucket="public" saveLocation={`cars/${props.stock}`} data={props} />
      <NewFileLine id="driving_video" label="Driving Video" allowable="videos" folder="videos" bucket="public" saveLocation={`cars/${props.stock}`} data={props} />
      <NewFileLine id="undercarriage_video" label="Undercarriage Video" allowable="videos" folder="videos" bucket="public" saveLocation={`cars/${props.stock}`} data={props} />
      <TextLine id={'youtube_link'} label='Youtube Link' data={props} updater={updater} placeholder="youtube.com" />
      {/* <Typography variant={"body1"} align="left" style={{padding: 7}}>
        Youtube Link: {props.youtube_link || "None yet"}
      </Typography> */}
      <Button variant="contained" color="primary" onClick={publish}>
        Merge & Upload Videos
      </Button>
    </div>
  );
}