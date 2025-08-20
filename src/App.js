import React from 'react';
import moment from 'moment';

import './App.css';

import { Switch, Route, Router, Redirect } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import LoginPage from './pages/LoginPage';
import CreateUserPage from './pages/CreateUserPage';
import CarPage from './pages/CarPage';
import CheckForm from './pages/CheckFormPage.js';
import ServiceOrderPage from './pages/ServiceOrderPage';
import ServiceOrderPage2 from './pages/ServiceOrderPage2';
import ServicePage from './pages/ServicePage';
import ServiceBoard from './pages/ServiceKanbanPage';
import PartPage from './pages/PartPage';
import LeadPage from './pages/LeadPage';
import ScanPage from './pages/ScanPage';
import CustomerPage from './pages/CustomerPage';
import InputPage from './pages/InputPage';
import AccountingPage from './pages/AccountingPage';
import DealDashboardPage from './pages/DealDashboardPage';
import PerformanceDashboard from './pages/PerformanceDashboard';
import DMVDashboardPage from './pages/DMVDashboardPage';
import SalesDashboardPage from './pages/SalesDashboardPage';
import PayrollPage from './pages/PayrollPage';
import PaymentPage from './pages/PaymentPage';
import WorldPacPage from './pages/WorldPacPage';
// import CreditAppPage from './pages/CreditAppPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import TaskDashboardPage from './pages/TaskDashboardPage';
import PipelinePage from './pages/PipelinePage';
import ServicePipelinePage from './pages/ServicePipelinePage';
import PartsPipelinePage from './pages/PartsPipelinePage';
import TimesheetPage from './pages/TimesheetPage';
import BackOfficePage from './pages/BackOfficePage';
import InventoryPage from './pages/InventoryPage';
import ServicePlanPage from './pages/ServicePlanPage';
import ServicePrioritiesPage from './pages/ServicePrioritiesPage';
import CreditCardStatementPage from './pages/CreditCardStatementPage';
import SalesInboxPage from './pages/SalesInboxPage';
import ShippingDashboardPage from './pages/ShippingDashboardPage/';
import ShippingLoadPage from './pages/ShippingLoadPage/';
import ServiceDashboardPage from './pages/ServiceDashboardPage/';
import PartsDashboardPage from './pages/PartsDashboardPage/';
import MechanicOrdersPage from './pages/MechanicOrdersPage/';
import Header from './components/Header';

import useWindowSize from './utilities/useWindowSize.js';
import history from './utilities/history';

import Camera, { FACING_MODES } from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';

import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { StateManager } from './utilities/stateManager';
import firebase from './utilities/firebase';

import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ListPage from './pages/ListPage';
import VendorPage from './pages/VendorPage';
import VendorDashboard from './pages/VendorDashboard';
import ShppingForm from './pages/ShippingPage.js';
import MechanicPage from './pages/MechanicPage';
import ThankYouPage from './pages/ThankYouPage';
import LeadsPage from './pages/LeadsPage';
import CreditAppsPage from './pages/CreditAppsPage';
import InspectionPage from './pages/InspectionPage';
import AssignInventoryPage from './pages/AssignInventoryPage.js';
import EstimatePage from './pages/EstimatePage.js';
import ServiceStatusPage from './pages/ServiceStatusPage.js';
import AdminToast from './components/AdminToast';
import MechanicToast from './components/MechanicToast';
import BankingPage from './pages/BankingPage';
import ConsignmentDashboardPage from './pages/ConsignmentDashboardPage';



function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const App = () => {

  const classes = useStyles();

  const size = useWindowSize();
  const [message, setMessage] = React.useState("Data posted successfully!");
  StateManager.setAlertMessage = setMessage;
  const [open, setOpen] = React.useState(false);
  StateManager.openAlert = setOpen;
  const [severity, setSeverity] = React.useState('success');
  StateManager.setAlertSeverity = setSeverity;
  StateManager.setAlertAndOpen = (message, severity) => {
    if(severity) setSeverity(severity);
    setMessage(message);
    setOpen(true);
    // setTimeout(handleClose, 3000);
  }
  const [loading, setLoading] = React.useState(false);
  StateManager.loading = loading;
  StateManager.setLoading = setLoading;

  const [pageLoading, setPageLoading] = React.useState(false);
  StateManager.pageLoading = pageLoading;
  StateManager.setPageLoading = setPageLoading;

  const [maxWidth, setMaxWidth] = React.useState("lg");
  StateManager.setMaxWidth = setMaxWidth;

  const [title, setTitle] = React.useState(document.title);
  StateManager.title = title;
  StateManager.setTitle = setTitle;

  const [windowDimensions, setWindowDimensions] = React.useState(getWindowDimensions());
  StateManager.windowDimensions = windowDimensions;

  const [showCamera, setCamera] = React.useState(false);
  StateManager.toggleCamera = () => setCamera(!showCamera);
  // StateManager.photoHandler = () => null;

  React.useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    console.log(title)
    document.title = title;
  }, [title])

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleTakePhoto = (dataUri) => {
    console.log("start", StateManager.photoHandler)
    StateManager.photoHandler(dataUri);
    // StateManager.toggleCamera();
  }

  return (
    <div className="App" style={{width: size.width, height: size.height}}>
      <CssBaseline />
      <Backdrop style={{zIndex: 999999, color: '#fff'}} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Backdrop style={{zIndex: 999999, color: '#fff'}} open={showCamera}>
        <div style={{backgroundColor: "#fff", zIndex: 99999999, position:"absolute", right: 10, top: 10}}>
          <IconButton onClick={StateManager.toggleCamera} size="large">
            <CloseIcon color='secondary' />
          </IconButton>
        </div>
        {
          showCamera && <Camera
            isFullscreen
            isSilentMode
            isMaxResolution
            idealFacingMode = {FACING_MODES.ENVIRONMENT}
            onTakePhoto = { (dataUri) => { handleTakePhoto(dataUri); } }
          />
        }
      </Backdrop>
      <Header title={title} />

      <div className={classes.root}>
        <main className={classes.content}>
          <Container className={`${classes.container}`} maxWidth={maxWidth}>
            <Router history={history}>
              <div className="section-to-print">
                <Switch>
                  {/* Protected Pages */}
                  <ProtectedRoute path="/form/:formName" render={props => (
                    <InputPage {...props} />
                  )} />
                  <ProtectedRoute path="/car/:stockNumber" render={props => <CarPage {...props} />} />
                  <ProtectedRoute path="/service-order/:stockNumber" render={props => <ServiceOrderPage {...props} />} />
                  <ProtectedRoute path="/service-order2/:stockNumber" render={props => <ServiceOrderPage2 {...props} />} />
                  <ProtectedRoute path="/service/:stockNumber" render={props => <ServicePage {...props} />} />
                  <ProtectedRoute path="/service-board" render={props => <ServiceBoard {...props} />} />
                  <ProtectedRoute path="/part/:stockNumber" render={props => <PartPage {...props} />} />
                  <ProtectedRoute path="/customer/:id" render={props => <CustomerPage {...props} />} />
                  <ProtectedRoute path="/accounting" render={props => <AccountingPage {...props} />} />
                  <ProtectedRoute path="/banking" render={props => <BankingPage {...props} />} />
                  <ProtectedRoute path="/deal-dashboard/:startDate/:endDate" render={props => <DealDashboardPage {...props} />} />
                  <ProtectedRoute path="/deal-dashboard/:month" render={props => {
                    const month = props.match.params.month;
                    const startDate = moment(month).startOf('month').format('YYYY-MM-DD');
                    const endDate = moment(month).endOf('month').format('YYYY-MM-DD');
                    return <Redirect to={`/deal-dashboard/${startDate}/${endDate}`} />;
                  }} />
                  <ProtectedRoute path="/performance-dashboard/:startMonth/:endMonth" render={props => <PerformanceDashboard {...props} />} />
                  <ProtectedRoute path="/dmv-dashboard/" render={props => <DMVDashboardPage {...props} />} />
                  <ProtectedRoute path="/sales-dashboard/" render={props => <SalesDashboardPage {...props} />} />
                  <ProtectedRoute path="/mechanic-summary/:endDate/:startDate" render={props => <MechanicPage {...props} />} />
                  <ProtectedRoute path="/pipeline/" render={props => <PipelinePage {...props} />} />
                  {/* <ProtectedRoute path="/service-pipeline/" render={props => <ServicePipelinePage {...props} />} /> */}
                  <ProtectedRoute path="/service-pipeline/" render={props => <ServiceDashboardPage {...props} />} />
                  <ProtectedRoute path="/service-dashboard/" render={props => <ServiceDashboardPage {...props} />} />
                  {/* <ProtectedRoute path="/parts-pipeline/" render={props => <PartsPipelinePage {...props} />} /> */}
                  <ProtectedRoute path="/parts-pipeline/" render={props => <PartsDashboardPage {...props} />} />
                  <ProtectedRoute path="/parts-dashboard/" render={props => <PartsDashboardPage {...props} />} />
                  <ProtectedRoute path="/shipping-dashboard/" render={props => <ShippingDashboardPage {...props} />} />
                  <ProtectedRoute path="/task-dashboard/:employee" render={props => <TaskDashboardPage {...props} />} />
                  <ProtectedRoute path="/task-dashboard/" render={props => <TaskDashboardPage {...props} />} />
                  <ProtectedRoute path="/backoffice/" render={props => <BackOfficePage {...props} />} />
                  <ProtectedRoute path="/timesheets/:date/" render={props => <TimesheetPage {...props} />} />
                  <ProtectedRoute path="/purchase_orders" render={props => <ListPage type="purchase-orders" {...props} />} />
                  <ProtectedRoute path="/leads" render={props => <LeadsPage {...props} />} />
                  <ProtectedRoute path="/lead/:lead_id/" render={props => <LeadPage {...props} />} />
                  <ProtectedRoute path="/deposits" render={props => <ListPage type="deposits" {...props} />} />
                  <ProtectedRoute path="/payroll/:date" render={props => <PayrollPage {...props} />} />
                  <ProtectedRoute path="/credit-apps" render={props => <CreditAppsPage {...props} />} />
                  <ProtectedRoute path="/worldpac" render={props => <WorldPacPage {...props} />} />
                  <ProtectedRoute path="/inspection" render={props => <InspectionPage {...props} />} />
                  <ProtectedRoute path="/inventory" render={props => <InventoryPage {...props} />} />
                  <ProtectedRoute path="/assign-part/:entryID" render={props => <AssignInventoryPage {...props} />} />
                  <ProtectedRoute path="/check-form/" render={props => <CheckForm {...props} />} />
                  <ProtectedRoute path="/parts-card-statement" render={props => <CreditCardStatementPage {...props} />} />
                  <ProtectedRoute path="/sales-inbox" render={props => <SalesInboxPage {...props} />} />
                  <ProtectedRoute path="/consignment-dashboard" render={props => <ConsignmentDashboardPage {...props} />} />
                  {/* <ProtectedRoute path="/credit-app/:id" render={props => <CreditAppsPage {...props} />} /> */}
                  {/* unprotected pages */} 
                  <Route path="/service-priorities" render={props => <ServicePrioritiesPage {...props} />} />
                  <Route path="/service-plan" render={props => <ServicePlanPage {...props} />} />
                  <Route path="/estimate" render={props => <EstimatePage {...props} />} />
                  <Route path="/service-status" render={props => <ServiceStatusPage {...props} />} />
                  <Route path="/mechanic-orders" render={props => <MechanicOrdersPage {...props} />} />
                  <Route path="/worldpac" render={props => <WorldPacPage {...props} />} />
                  <Route path="/payment" render={props => <PaymentPage {...props} />} />
                  <Route path="/payment-status" render={props => <PaymentConfirmationPage {...props} />} />
                  <Route path="/thankyou" render={props => <ThankYouPage {...props} />} />
                  <Route path="/new-user" render={props => <CreateUserPage {...props} />} />
                  <Route path="/scan" render={props => <ScanPage {...props} />} />
                  <Route path="/vendor-items/:vendor" render={props => <VendorPage {...props} />} />
                  <Route path="/vendor-dashboard/:vendor?" render={props => <VendorDashboard {...props} />} />
                  <Route path="/shipping-submit/" render={props => <ShppingForm {...props} />} />
                  <Route path="/input/" render={props => <InputPage {...props} page={"edit-vendor-item"} />} />
                  <Route path="/load/:loadId" render={props => <ShippingLoadPage {...props} />} />
                  {/* redirect user to page below if route does not exist */} 
                  <Route path="/" render={props => StateManager.authed ? getHomePage(props) : <LoginPage {...props} />} />
                </Switch>
              </div>
            </Router>
          </Container>
        </main>
      </div>

      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" onClose={handleClose} severity={severity} >
          {message}
        </MuiAlert>
      </Snackbar>

      <AdminToast />
      <MechanicToast />
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

const ProtectedRoute = (props) => {
  const isAuthed = localStorage.getItem('authed') || sessionStorage.getItem('authed');
  const page = props.path.replace("/", "").split("/")[0];
  const isAllowed = StateManager.isUserAllowed(page) || StateManager.isAdmin();
  return(
    isAuthed && isAllowed  
      ? <Route {...props} />
      : <Redirect to={{pathname: "/"}} />
  )
}

const getHomePage = (props) => {
  let page = <InventoryPage {...props} />
  switch (StateManager.userType) {
    case "mechanic":
      page = <MechanicOrdersPage {...props} />
      break;

    case "sales":
      page = <InventoryPage {...props} />
      break;

    case "service":
      page = <ServicePipelinePage {...props} />
      break;
  }

  return page;
}

export default App;
