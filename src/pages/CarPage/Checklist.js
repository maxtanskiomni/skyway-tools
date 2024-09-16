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
import Expenses from './Transactions.js';
import Funding from './Funding.js';
import CarSummary from './CarSummary.js';
import DMVSummary from './DMVSummary.js';
import FileBank from './FileBank.js';
import Paperwork from './Paperwork.js';
import SimpleTable from '../../components/SimpleTable';
import Header from '../../components/Header';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import Preview from '../../components/Preview.js';

export default function Checklist(props) {
    const { stockNumber } = props;

    const sections = ['car-information','paperwork', 'license', 'insurance', 'funding', 'expenses', 'DMV Work', 'shipping'];
    const components = [
        <CarSummary/>,
        <Paperwork/>, 
        <FileBank cta={'Upload License'}/>,
        <FileBank cta={'Upload Insurance'}/>,
        <Funding stockNumber={stockNumber}/>, 
        <Expenses stockNumber={stockNumber}/>, 
        <DMVSummary/>, 
        <CarSummary/>
    ];

    return (
        <div>
            <CssBaseline />
            {
                sections.map((section, i) => 
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <FormControlLabel control={<Checkbox onClick={e => e.stopPropagation()} />} label={formatTitle(section)} />
                            {/* <Typography className={classes.heading}>{formatTitle(section)}</Typography> */}
                        </AccordionSummary>
                        <AccordionDetails>
                            {components[i]}
                        </AccordionDetails>
                    </Accordion>
                )
            }
        </div>
        );
}

const formatTitle = raw => {
  raw = raw.split('-');
  raw = raw.join(' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}