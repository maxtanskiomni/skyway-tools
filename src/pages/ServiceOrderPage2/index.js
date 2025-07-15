import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress, 
  Avatar,
  TextField,
  Button,
  Divider,
  IconButton,
  Modal
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useHistory } from 'react-router-dom';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import algolia from '../../utilities/algolia';
import ServiceItemsTable from './ServiceItemsTable';
import PurchasesTable from './PurchasesTable';
import AdminSection from './AdminSection';
import AccountingSection from './AccountingSection';
import Invoice from '../ServiceOrderPage/Invoice';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  height: '100%',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 1200,
  maxHeight: '90vh',
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
}));

export default function ServiceOrderPage2(props) {
  const { stockNumber } = props.match.params;
  const history = useHistory();
  const [order, setOrder] = React.useState({});
  const [showInvoice, setShowInvoice] = React.useState(false);
  
  StateManager.setOrder = setOrder;
  StateManager.updateCar = data => setOrder({...order, ...data});
  StateManager.updateOrder = data => setOrder({...order, ...data});
  StateManager.setTitle(`${stockNumber}`);

  React.useEffect(() => {
    async function fetchData() {
      const db = firebase.firestore();
      const doc = await db.doc('orders/'+stockNumber).get();
      
      if(doc.exists) {
        let data = doc.data();
        StateManager.setTitle(`${stockNumber} ${data.description || ""}`);
        data.disabled = !StateManager.isAdmin() && data.status === constants.order_statuses.at(-1);
        data.order_loaded = true;
        setOrder({...data});
        data.updater = setOrder;

        // Fetch all related data in parallel
        const [
          expenseSnap,
          servicesSnap,
          customerDoc,
          carDoc,
          depositsSnap
        ] = await Promise.all([
          db.collection('purchases').where('stock', '==', stockNumber).get(),
          db.collection('services').where('order', '==', stockNumber).get(),
          data.customer ? db.doc('customers/'+data.customer).get() : Promise.resolve(null),
          data.car ? db.doc('cars/'+data.car).get() : Promise.resolve(null),
          db.collection('deposits').where('stock', '==', stockNumber).get()
        ]);

        // Process data
        data.expenses = expenseSnap.docs.map(getDocData);
        data.expenses_loaded = true;
        data.services = servicesSnap.docs.map(getDocData);
        data.services_loaded = true;
        data.deposits = depositsSnap.docs.map(getDocData).filter(x => x.type === "service");
        data.deposits_loaded = true;

        if (customerDoc?.exists) {
          data.customer = {...customerDoc.data(), id: data.customer};
          data.customer.display_name = `${data.customer.first_name} ${data.customer.last_name}`;
        }
        data.customer_loaded = true;

        if (carDoc?.exists) {
          data.car = {...carDoc.data(), id: data.car};
          data.car.title = `${data.car.stock || ""} ${data.car.year || ""} ${data.car.make || ""} ${data.car.model || ""}`;
        }
        data.car_loaded = true;

        setOrder({...data});
      } else {
        StateManager.setAlertAndOpen('Service order not found', 'error');
        history.push('/');
      }
    }
    fetchData();
    StateManager.updateCar = fetchData;
  }, [stockNumber]);

  const handleInvoiceClick = () => {
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
  };

  if (!order.order_loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        {/* Admin Section */}
        <AdminSection 
          order={order}
          stockNumber={stockNumber}
          disabled={order.disabled}
        />

        {/* Accounting Section */}
        <StyledPaper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Accounting</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={handleInvoiceClick}
              disabled={order.disabled}
            >
              View Invoice
            </Button>
          </Box>
          <AccountingSection
            order={order}
            stockNumber={stockNumber}
            disabled={order.disabled}
          />
        </StyledPaper>

        {/* Services Section */}
        <StyledPaper>
          <ServiceItemsTable 
            items={order.services || []} 
            stockNumber={stockNumber}
            disabled={order.disabled}
          />
        </StyledPaper>

        {/* Purchases Section */}
        <StyledPaper>
          <PurchasesTable 
            purchases={order.expenses || []}
            stockNumber={stockNumber}
            disabled={order.disabled}
          />
        </StyledPaper>
      </Box>

      <Modal
        open={showInvoice}
        onClose={handleCloseInvoice}
        aria-labelledby="invoice-modal"
      >
        <ModalContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button onClick={handleCloseInvoice} variant="outlined">
              Close Invoice
            </Button>
          </Box>
          <Invoice order={order} />
        </ModalContent>
      </Modal>
    </>
  );
}

const getDocData = doc => ({id: doc.id, ...doc.data()}); 