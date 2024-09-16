import React, { useState } from 'react';
import { Paper, TextField, Button, Box, Typography, Grid } from '@mui/material';
import firebase from '../utilities/firebase';
import moment from 'moment';
import { StateManager } from '../utilities/stateManager';

const VendorForm = () => {
  const [vendor, setVendor] = useState("");
  const [lines, setLines] = useState([{
    date: '',
    car_load: '',
    start_zip_code: '',
    end_zip_code: '',
    miles: '',
    carLoadError: '' // Add a property to track error for each line
  }]);
  
  const ratePerMile = 0.64; // Assume the rate is $0.5 per mile

  // Function to validate car_load
  const validateCarLoad = (carLoad) => {
    // Implement your validation logic here
    if (!carLoad.trim()) return "Car load cannot be empty.";
    if (!isValidStockNumberList(carLoad.trim())) return "Car load must be a list of stock numbers (ex: 1247-FL, 3850-FL)";
    return "";
  };

  const handleInputChange = (index, event) => {
    const newLines = [...lines];
    const { name, value } = event.target;
    newLines[index][name] = value;

    // Validate car_load when it's changed
    if (name === "car_load") {
      const errorMessage = validateCarLoad(value);
      newLines[index].carLoadError = errorMessage;
    }

    setLines(newLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      { date: '', car_load: '', start_zip_code: '', end_zip_code: '', miles: '', carLoadError: '' }
    ]);
  };

  const handleSubmit = async (event) => {
    StateManager.setLoading(true);
    event.preventDefault();
    console.log('Form Data:', lines);
    // Calculate the total miles and total amount
    const totalMiles = lines.reduce((acc, line) => acc + Number(line.miles), 0);
    const totalAmount = totalMiles * ratePerMile;
    const stock_numbers = lines.reduce((acc, line) =>[...acc, ...extractStockNumbers(line.car_load)], []);
    const amount = totalAmount/(stock_numbers.length || 1)

    console.log(totalMiles, totalAmount, stock_numbers);
    const date = moment().format("YYYY/MM/DD");
    
    //Upload the submission for later review
    const sub_ref = firebase.firestore().collection("vendor_submissions").doc();
    await sub_ref.set({date, vendor, totalAmount, totalMiles, stock_numbers, lines});
    
    //Upload purchases to each car
    const purchase = {
      date,
      isPayable: true,
      vendor,
      amount,
      memo: "Shipping charge",
      submission: sub_ref.id,
    }
    const purchaseUploads = stock_numbers.map(stock => {
      return firebase.firestore().collection("purchases").doc().set({...purchase, stock})
    })

    await Promise.all(purchaseUploads);

    StateManager.setLoading(false);
    StateManager.setAlertAndOpen("Invoice submitted!", "success");
    setLines([{
      date: '',
      car_load: '',
      start_zip_code: '',
      end_zip_code: '',
      miles: '',
      carLoadError: '' // Add a property to track error for each line
    }]);
  };

  // Calculate the total miles and total amount
  const totalMiles = lines.reduce((acc, line) => acc + Number(line.miles), 0);
  const totalAmount = totalMiles * ratePerMile;

  // Check if any line has an error or an unfilled required field to disable the submit button
  const isSubmitDisabled = !vendor || lines.some(line => 
    line.carLoadError.length > 0 || 
    !line.date || 
    !line.start_zip_code || 
    !line.end_zip_code || 
    !line.miles ||
    !line.car_load
  );

  return (
    <Paper style={{ padding: '20px', margin: '20px' }}>
      <Typography variant="h6">Vendor Item Submission</Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          fullWidth
          label="Vendor Name"
          name="vendorName"
          margin="normal"
          variant="outlined"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
        {lines.map((line, index) => (
          <Grid container spacing={2} key={index}>
            <Grid item xs={2}>
              <TextField
                label="Date"
                name="date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={line.date}
                onChange={(e) => handleInputChange(index, e)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Start Zip Code"
                name="start_zip_code"
                value={line.start_zip_code}
                onChange={(e) => handleInputChange(index, e)}
                fullWidth
                type="number"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="End Zip Code"
                name="end_zip_code"
                value={line.end_zip_code}
                onChange={(e) => handleInputChange(index, e)}
                fullWidth
                type="number"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Miles"
                name="miles"
                type="number"
                value={line.miles}
                onChange={(e) => handleInputChange(index, e)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Car Load"
                name="car_load"
                value={line.car_load}
                onChange={(e) => handleInputChange(index, e)}
                error={line.carLoadError.length > 0}
                helperText={line.carLoadError}
                fullWidth
                multiline={true}
                rows={3}
                variant="outlined"
              />
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={addLine} sx={{ mr: 1 }}>
            Add Line
          </Button>
          <Button variant="contained" color="secondary" type="submit" disabled={isSubmitDisabled}>
            Submit
          </Button>
        </Box>
        <Box mt={2}>
          <Typography variant="body1">Total Miles: {totalMiles}</Typography>
          <Typography variant="body1">Rate per Mile: ${ratePerMile.toFixed(2)}</Typography>
          <Typography variant="body1">Total Amount: ${totalAmount.toFixed(2)}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default VendorForm;

function isValidStockNumberList(text) {
  // Trim any leading or trailing whitespace for accurate validation
  text = text.trim();
  
  // Normalize the separators by replacing multiple spaces or a combination of comma and spaces with a single comma
  text = text.replace(/,\s*|\s+/g, ',');

  // Define the regular expression to match the entire string format
  const pattern = /^(?:\d+-(F|f)(L|l))(?:,\d+-(F|f)(L|l))*$/;

  // Test the entire normalized input text against the pattern
  return pattern.test(text);
}

function extractStockNumbers(text) {
  // Normalize the separators by replacing multiple spaces or a combination of comma and spaces with a single comma
  text = text.toUpperCase().replace(/,\s*|\s+/g, ',');

  // Define the regular expression pattern to match stock numbers like '1234-FL'
  const pattern = /\b\d+-FL\b/g;
  
  // Find all matches in the normalized input text
  const matches = text.match(pattern);
  
  // Return the array of matched stock numbers or an empty array if no matches
  return matches || [];
}
