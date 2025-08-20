import React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import firebase from '../../utilities/firebase';

import { StateManager } from '../../utilities/stateManager';
import algolia from '../../utilities/algolia';
import { MenuItem, Select, Button } from '@mui/material';
import DatePicker from "react-datepicker";
import InputLabel from '@mui/material/InputLabel';
import moment from 'moment';
import NewFileLine from '../../components/NewFileLine.js';
import CreditAppSelectorDialog from '../../components/CreditAppSelectorDialog.js';

export default function CustomerSummary(props) {
  const { cust_id } = props;
  const classes = useStyles();
  const [loading, setLoading] = React.useState(true);
  const [cust, setCust] = React.useState({});
  const [profileImageUrl, setProfileImageUrl] = React.useState(null);
  const [creditAppDialogOpen, setCreditAppDialogOpen] = React.useState(false);

  const onChange = async (e) => {
    console.log(e)
    const data = {[e.target.id || e.target.name]: e.target.value};
    await firebase.firestore().collection('customers').doc(cust_id).set(data, {merge:true});
    let new_cust = {...cust}
    new_cust = Object.assign(new_cust, data);
    setCust(new_cust);

    algolia.updateRecord("customers", {objectID: cust_id, ...data});
  }

  const updateProfileImage = async (update) => {
    if (update.license) {
      try {
        const url = await firebase.app().storage("skyway-dev-373d5.appspot.com").ref(update.license).getDownloadURL();
        setProfileImageUrl(url);
      } catch (error) {
        console.error('Error loading profile image:', error);
        setProfileImageUrl('/missing_image.jpeg');
      }
    } else {
      setProfileImageUrl('/missing_image.jpeg');
    }
  }

  const handleCreditAppSelect = async (creditAppLocation) => {
    const data = { credit_app: creditAppLocation };
    await firebase.firestore().collection('customers').doc(cust_id).set(data, {merge:true});
    let new_cust = {...cust}
    new_cust = Object.assign(new_cust, data);
    setCust(new_cust);

    algolia.updateRecord("customers", {objectID: cust_id, ...data});
  }
  
  const personalInfoFields = [
    {id: 'first_name', type: "text", label: "First Name"},
    {id: 'last_name', type: "text", label: "Last Name"},
    {id: "email", type: "text", label: "Email"},
    {id: 'phone_number', type: "text", label: "Phone Number"},
    {id: "birthday", type: "date", label: "Birthday"},
    {id: "sex", type: "select", label: "Gender", selections: StateManager.sexes},
  ];

  const addressFields = [
    {id: 'address1', type: "text", label: "Address"},
    {id: 'city', type: "text", label: "City"},
    {id: 'state', type: "select", label: "State", selections: StateManager.states},
    {id: 'zip', type: "text", label: "ZIP Code"},
  ];

  const financialFields = [
    {id: "routing_number", type: "text", label: "Routing Number"},
    {id: "account_number", type: "text", label: "Account Number"},
  ];

  const documentFields = [
    {id: "dl", type: "text", label: "Driver's License Number"},
    {id: "license", type: "file", label: "Driver's License Front"},
    {id: "license_back", type: "file", label: "Driver's License Back"},
    {id: "insurance", type: "file", label: "Insurance"},
    {id: "credit_app", type: "credit-app-selector", label: "Credit Application"},
  ];

  const notesFields = [
    {id: "comments", type: "text", label: "Comments", multiline: true},
    {id: "notes", type: "text", label: "Notes", multiline: true},
  ];

  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const doc = await db.doc('customers/'+cust_id).get();
      if(doc.exists) {
        const customerData = {id: doc.id, ...doc.data()};
        setCust(customerData);
        StateManager.setTitle(`${(customerData.first_name || "")} ${(customerData.last_name || "")}`);
        
        // Load profile image
        if (customerData.license) {
          try {
            const url = await firebase.app().storage("skyway-dev-373d5.appspot.com").ref(customerData.license).getDownloadURL();
            setProfileImageUrl(url);
          } catch (error) {
            console.error('Error loading profile image:', error);
            setProfileImageUrl('/missing_image.jpeg');
          }
        } else {
          setProfileImageUrl('/missing_image.jpeg');
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [cust_id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      {/* Profile Header */}
      <Card className={classes.profileCard} elevation={0}>
        <CardContent className={classes.profileContent}>
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <Box className={classes.avatarContainer}>
                <Avatar 
                  src={profileImageUrl} 
                  alt={`${cust.first_name || 'Customer'} ${cust.last_name || ''}`}
                  className={classes.profileAvatar}
                  imgProps={{
                    onError: () => setProfileImageUrl('/missing_image.jpeg')
                  }}
                />
                <Box className={classes.avatarOverlay}>
                  <NewFileLine 
                    id="license" 
                    label="" 
                    allowable="imageLike" 
                    folder="customer_data" 
                    saveLocation={`customers/${cust_id}`} 
                    data={cust} 
                    removeCheck 
                    updater={updateProfileImage}
                    removeDelete
                    removeView
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h3" component="h1" className={classes.customerName}>
                {`${cust.first_name || ''} ${cust.last_name || 'Customer'}`}
              </Typography>
              {cust.phone_number && (
                <Typography variant="body1" className={classes.customerId}>
                  {cust.phone_number}
                </Typography>
              )}
              {cust.email && (
                <Typography variant="body2" className={classes.customerEmail}>
                  {cust.email}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4} className={classes.contentGrid}>
        {/* Personal Information */}
        <Grid item xs={12} lg={6}>
          <Card className={classes.sectionCard} elevation={0}>
            <CardContent className={classes.sectionContent}>
              <Typography variant="h5" className={classes.sectionTitle}>
                Personal Information
              </Typography>
              <Grid container spacing={3}>
                {personalInfoFields.map(field => (
                  <Grid item xs={12} sm={6} key={field.id}>
                    {renderInput(field, cust, onChange, setCreditAppDialogOpen, setCust, algolia)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12} lg={6}>
          <Card className={classes.sectionCard} elevation={0}>
            <CardContent className={classes.sectionContent}>
              <Typography variant="h5" className={classes.sectionTitle}>
                Address Information
              </Typography>
              <Grid container spacing={3}>
                {addressFields.map(field => (
                  <Grid item xs={12} sm={6} key={field.id}>
                    {renderInput(field, cust, onChange, setCreditAppDialogOpen, setCust, algolia)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Information */}
        <Grid item xs={12} lg={6}>
          <Card className={classes.sectionCard} elevation={0}>
            <CardContent className={classes.sectionContent}>
              <Typography variant="h5" className={classes.sectionTitle}>
                Financial Information
              </Typography>
              <Grid container spacing={3}>
                {financialFields.map(field => (
                  <Grid item xs={12} sm={6} key={field.id}>
                    {renderInput(field, cust, onChange, setCreditAppDialogOpen, setCust, algolia)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents */}
        <Grid item xs={12} lg={6}>
          <Card className={classes.sectionCard} elevation={0}>
            <CardContent className={classes.sectionContent}>
              <Typography variant="h5" className={classes.sectionTitle}>
                Documents
              </Typography>
              <Grid container spacing={3}>
                {documentFields.map(field => (
                  <Grid item xs={12} key={field.id}>
                    {renderInput(field, cust, onChange, setCreditAppDialogOpen, setCust, algolia)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Card className={classes.sectionCard} elevation={0}>
            <CardContent className={classes.sectionContent}>
              <Typography variant="h5" className={classes.sectionTitle}>
                Notes & Comments
              </Typography>
              <Grid container spacing={3}>
                {notesFields.map(field => (
                  <Grid item xs={12} key={field.id}>
                    {renderInput(field, cust, onChange, setCreditAppDialogOpen, setCust, algolia)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Credit App Selection Dialog */}
      <CreditAppSelectorDialog
        open={creditAppDialogOpen}
        onClose={() => setCreditAppDialogOpen(false)}
        onSelect={handleCreditAppSelect}
        customerId={cust_id}
      />
    </Box>
  );
}

function renderInput(input, data, updater, setCreditAppDialogOpen, setCust, algolia){
  const {type, id, selections = [], label} = input;

  if(type === "text"){
    return (
      <TextField
        defaultValue={data[id] || ''}
        multiline={input.multiline || false}
        rows={input.multiline ? 3 : 1}
        onBlur={updater}
        id={id}
        name={id}
        label={label}
        fullWidth
        variant="outlined"
        size="small"
      />
    )
  }

  if(type === "select"){
    return (
      <>
        <InputLabel id={id} style={{textAlign: "left", marginBottom: '8px'}}>{label}</InputLabel>
        <Select
          style={{width: '100%', textAlign: "left"}}
          labelId={id}
          id={id}
          name={id}
          value={data[id] || ''}
          onChange={updater}
          variant="outlined"
          size="small"
        >
          {selections.map( selection => <MenuItem key={selection.value} value={selection.value}>{selection.label}</MenuItem>)}
        </Select>
      </>
    )
  }

  if(type === "file"){
    return (
      <NewFileLine 
        id={id} 
        label={label} 
        allowable="imageLike" 
        folder="customer_data" 
        saveLocation={`customers/${data.id}`} 
        data={data} 
        removeCheck 
      />
    )
  }

  if(type === "credit-app-selector"){
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setCreditAppDialogOpen(true)}
          >
            {data[id] ? 'Change Selection' : 'Select Credit App'}
          </Button>
        </Box>
        {data[id] && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'action.hover', 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={500}>
                Credit App Selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => window.open(data[id], '_blank')}
                >
                  View
                </Button>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={async () => {
                    const data_update = { [id]: null };
                    await firebase.firestore().collection('customers').doc(data.id).set(data_update, {merge:true});
                    let new_cust = {...data}
                    new_cust = Object.assign(new_cust, data_update);
                    setCust(new_cust);
                    algolia.updateRecord("customers", {objectID: data.id, ...data_update});
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    )
  }

  if(type === "date"){
    const onChange = date =>{
      const e = {
        target: { id, value :moment(date).format("YYYY/MM/DD") }
      }
      updater(e);
    }
    return (
      <DatePicker 
        onChange={onChange} 
        selected={data[id] ? new Date(data[id]) : null}
        customInput={<TextField style={{width: '100%'}} label={label} variant="outlined" size="small"/>}
        dateFormat="MM/dd/yyyy"
        placeholderText="Select date"
      />
    )
  }
}

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(4),
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  profileCard: {
    marginBottom: theme.spacing(4),
    backgroundColor: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e0e0e0',
  },
  profileContent: {
    padding: theme.spacing(4),
  },
  avatarContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  profileAvatar: {
    width: 140,
    height: 140,
    border: '3px solid #ffffff',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
    },
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '$avatarContainer:hover &': {
      opacity: 1,
    },
  },
  customerName: {
    fontWeight: 300,
    color: '#1a1a1a',
    marginBottom: theme.spacing(1),
    letterSpacing: '-0.5px',
  },
  customerId: {
    color: '#666666',
    fontWeight: 500,
    marginBottom: theme.spacing(0.5),
  },
  customerEmail: {
    color: '#888888',
    fontWeight: 400,
  },
  contentGrid: {
    marginTop: theme.spacing(2),
  },
  sectionCard: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#e0e0e0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
  },
  sectionContent: {
    padding: theme.spacing(3),
  },
  sectionTitle: {
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: theme.spacing(3),
    fontSize: '1.25rem',
    letterSpacing: '-0.25px',
  },
}));