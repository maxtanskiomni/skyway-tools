import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Lightbox } from "react-modal-image";
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SimpleTable from './SimpleTable';
import firebase from '../utilities/firebase';
import history from '../utilities/history';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Checkbox from '@mui/material/Checkbox';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Delete } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';


export default function Dropdown(props) {
  let { id, expand } = props;
  const url = new URL(window.location.href)
  if(!expand) expand = id == url.searchParams.get("expand")
  const [checked, setChecked] = React.useState(props.checked);

  const clickCheck = (e) => {
    e.stopPropagation();
    props.clickCheck(e.target.checked);
    setChecked(e.target.checked)
  }

  const updateURL = () => {
    if(props.disabledURLUpdate) return;
    const url = new URL(window.location.href);
    let params = url.pathname

    if(url.search === '') params += "?expand="+id;
    else if(url.search.indexOf('expand=') < 0) params += url.search + "&expand="+id;
    else if(url.search.indexOf('&expand='+id) > -1) params += url.search.replace(/&?expand=.*[^&]/g, "");
    else if(url.search.indexOf('?expand='+id) > -1) params += url.search.replace(/\??expand=.*[^&]/g, "");
    else params += url.search.replace(/expand=.*[^&]/g, "expand="+id);
    history.replace(params)
  }

  return (
    <Accordion style={{marginBottom: 5}} defaultExpanded={expand} onChange={updateURL}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
        >
          <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            <FormLabel style={{textAlign: 'left', color:"#000"}} >{props.label}</FormLabel>
            <Typography variant='body1' align="left" style={{display: 'flex', alignItems: "center"}}>
              {props.value}
              {props.action}
            </Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails style={{flexDirection: "column"}}>
          {props.component || props.children || ""}
        </AccordionDetails>
    </Accordion>
  );
}
