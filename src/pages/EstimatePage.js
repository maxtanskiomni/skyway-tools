import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import queryString from 'query-string';
import {
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import SignaturePad from 'react-signature-canvas';
import axios from 'axios';
import firebase from '../utilities/firebase';
import { StateManager } from '../utilities/stateManager';
import RequestManager from '../utilities/requestManager';
import moment from 'moment';
import constants from '../utilities/constants';

const EstimatePage = () => {
  const location = useLocation();
  const history = useHistory();
  const queryParams = queryString.parse(location.search);
  const [inputType, setInputType] = useState(true);
  const [carValue, setCarValue] = useState('');
  const [customerName, setCustomerName] = useState('Skyway Classics');
  const [notes, setNotes] = useState('');
  const [revenue, setRevenue] = useState('');
  const [signature, setSignature] = useState(null);
  const [items, setItems] = useState([]);
  const sigPadRef = useRef(null);

  const fetchEstimateData = async (estimateId) => {
    try {
      const response = await axios.get(`/get-estimate/${estimateId}`);
      const { customerName, notes, revenue } = response.data;
      setCustomerName(customerName);
      setNotes(notes);
      setRevenue(revenue);
    } catch (error) {
      console.error('Error fetching estimate data:', error);
    }
  };

  useEffect(() => {
    const {id} = queryParams;
    if (!id) {
      // If no ID in the URL, generate one and replace the current URL
      const newId = uuidv4();
      history.replace(`estimate?id=${newId}`);
    } else {
      fetchEstimateData(id);
    }
  }, []);
// }, [queryParams, history, location.pathname]);


  const toggleInputType = () => {
    setInputType(!inputType);
    setCustomerName(!inputType ? "Skyway Classics" : "");
  };

  const handleCarValue = (event) => {
    setCarValue(event.target.value);
  };

  const handleNameChange = (event) => {
    setCustomerName(event.target.value);
  };

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  const handleRevenueChange = (event) => {
    let value = event.target.value;
    // Check if the input value is a valid number format, then remove leading zeros
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
        // Remove leading zeros except for decimal numbers like 0.33
        if (value !== '0' && /^0[0-9]+/.test(value)) {
            value = value.replace(/^0+/, '');
        }
        setRevenue(value);
    }
};

  const handleGetEstimate = async () => {
    StateManager.setLoading(true);
    try {
      const parameters = {
        function: "getEstimate",
        variables:{
          notes,
        }
      };
      let response = await RequestManager.post(parameters);
      console.log(response)
      setRevenue(response.revenue);
      setItems(response.items);
    } catch (error) {
      console.error('Error fetching estimate:', error);
    }
    StateManager.setLoading(false);
  };

  const clearSignature = () => {
    sigPadRef.current.clear();
    setSignature(null);
  };

  const saveSignature = () => {
    setSignature(sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'));
    // setSignature(sigPadRef.current.getTrimmedCanvas().toData('image/png'));
  };

  const handleSubmit = async () => {
    try {
      //Get the counters to get correct SO and car stock numbers
      let counters = await firebase.firestore().doc('admin/counters').get();
      counters = counters.data();

      //Make a SR car if this is not a Skyway customer
      if(!inputType){


      } 

      const repair_order = {
        date: moment().format("YYYY/MM/DD"),
        status_time: moment().format("YYYY/MM/DD"),
        status: constants.service_statuses.at(0),
        items,
        customer: customerName,
        revenue,
        signature,
        car: carValue,
      }
      console.log(repair_order);
      // await firebase.firestore()
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={inputType} onChange={toggleInputType} />}
          label={inputType ? "Skyway Car" : "Customer Car"}
          sx={{ mb: 2 }}
        />
        <TextField
          label={inputType ? "Enter Stock Number" : "Enter Year Make Model (e.g. 1969 Chevrolet Chevlle)"}
          variant="outlined"
          fullWidth
          value={carValue}
          onChange={handleCarValue}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Customer Name"
          variant="outlined"
          disabled={inputType}
          fullWidth
          value={customerName}
          onChange={handleNameChange}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Notes"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={handleNotesChange}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleGetEstimate} sx={{ mb: 2 }}>
          Get Estimate
        </Button>
        <List>
          <Typography>Serivce Items</Typography>
          <Typography>{items.length <= 0 ? "Add notes to make items" : ""}</Typography>
          {items.map((item, index) => (
            <ListItem key={index}>
              <ListItemText primary={`${index+1}. ${item.name}`} />
            </ListItem>
          ))}
        </List>
        <TextField
          label="Revenue"
          variant="outlined"
          fullWidth
          value={revenue}
          onChange={handleRevenueChange}
          sx={{ mb: 2 }}
        />
        <Box sx={{ border: '1px solid gray', p: 2, mb: 2 }}>
          <SignaturePad 
            ref={sigPadRef}
            onEnd={saveSignature}
            canvasProps={{width: 500, height: 200, className: 'signatureCanvas'}}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button onClick={clearSignature}>Clear</Button>
          </Box>
        </Box>
        <Button
          variant="contained"
          disabled={!revenue || !signature || !carValue}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </FormGroup>
    </Paper>
  );
}

export default EstimatePage;
