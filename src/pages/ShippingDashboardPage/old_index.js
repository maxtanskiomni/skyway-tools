import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { 
  Container, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import RequestManager from '../../utilities/requestManager';
import { StateManager } from '../../utilities/stateManager';
import firebase from '../../utilities/firebase';
import Blade from '../../components/Blade';
import ShippingControls from './ShippingControls';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  table: {
    minWidth: 650,
  },
  thumbnail: {
    width: 100,
    height: 75,
    objectFit: 'cover',
  },
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  shippingChip: {
    '&.shipping-in': {
      backgroundColor: theme.palette.info.light,
      color: theme.palette.info.contrastText,
    },
    '&.shipping-out': {
      backgroundColor: theme.palette.success.light,
      color: theme.palette.success.contrastText,
    },
  },
}));

const ShippingDashboardPage = () => {
  const classes = useStyles();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [bladeOpen, setBladeOpen] = useState(false);
  StateManager.setTitle(`Shipping Dashboard`);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await RequestManager.get({
          function: 'getCarsNeedingShipping'
        });
        if(response.success){ 
          // Fetch customer information for each car)
          const fundedCars = await Promise.all(response.data.map(async (car) => {
            let data = {...car};

            const dealDoc = await firebase.firestore().doc(`deals/${car.id}`).get();
            const deal = dealDoc.data() || {};
            delete deal.shipping_in;
            data.deal = deal;


            if(deal.shipping){
              const shippingDoc = await firebase.firestore().doc(`invoices/${deal.shipping}`).get();
              data.shipping_invoice = shippingDoc.data() || {};
            }

            const serviceOrderDocs = await firebase.firestore().collection('orders').where('car', '==', car.id).get();
            data.orders = serviceOrderDocs.docs.map(doc => doc.data());

            if (deal.buyer) {
              const customerDoc = await firebase.firestore().doc(`customers/${deal.buyer}`).get();
              data.customer = customerDoc.data() || {};
            }

            return data;
          }));
          setCars(fundedCars);
        } else {
          throw new Error("Error fetching cars");
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        StateManager.setAlertAndOpen("Error fetching cars", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleRowClick = (car) => {
    setSelectedCar(car);
    setBladeOpen(true);
  };

  const handleBladeClose = () => {
    setBladeOpen(false);
    setSelectedCar(null);
  };

  const handleCarUpdate = (updatedCar) => {
    setCars(cars.map(car => 
      car.id === updatedCar.id ? updatedCar : car
    ));
  };

  if (loading) {
    return (
      <Container className={classes.root}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Shipping Dashboard
      </Typography>
      <TableContainer component={Paper}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Car</TableCell>
              <TableCell>Customer Information</TableCell>
              <TableCell>Incomplete Service Orders</TableCell>
              <TableCell>Shipping Invoice</TableCell>
              <TableCell>Shipping Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cars.map((car) => (
              <TableRow 
                key={car.id} 
                className={classes.tableRow}
                onClick={(e) => {
                  // Don't open blade if clicking the thumbnail
                  if (!e.target.closest('a')) {
                    handleRowClick(car);
                  }
                }}
              >
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <a href={`/car/${car.stock}`} style={{ textDecoration: 'none' }}>
                      <img 
                        src={car.thumbnail || '/missing_image.jpeg'} 
                        alt={car.title} 
                        className={classes.thumbnail}
                      />
                    </a>
                    <div>
                      <Typography variant="subtitle1">
                        {car.title || 'Unnamed Car'}
                      </Typography>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {car.customer ? (
                    <div>
                      <Typography variant="subtitle2" gutterBottom>
                        {`${car.customer.first_name || ''} ${car.customer.last_name || ''}`}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {car.customer.address1}
                        {car.customer.address2 && <>, {car.customer.address2}</>}
                        {car.customer.city && <>, {car.customer.city}</>}
                        {car.customer.state && <>, {car.customer.state}</>}
                        {car.customer.zip && <> {car.customer.zip}</>}
                      </Typography>
                    </div>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No customer information available
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={car.orders?.filter(order => !order.complete).length > 0 ? 'error' : 'textSecondary'}
                  >
                    {car.orders?.filter(order => !order.complete).length || 0} incomplete
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {car.deal?.shipping_invoice?.price ? `$${car.deal.shipping_invoice.price}` : 'No invoice'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {car.deal?.shipping_in ? (
                    <Chip
                      icon={<DownloadIcon />}
                      label="Shipping In"
                      className={`${classes.shippingChip} shipping-in`}
                      size="small"
                    />
                  ) : car.deal?.shipping ? (
                    <Chip
                      icon={<UploadIcon />}
                      label="Shipping Out"
                      className={`${classes.shippingChip} shipping-out`}
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<DirectionsCarIcon />}
                      label="Not Set"
                      size="small"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Blade 
        open={bladeOpen} 
        onClose={handleBladeClose}
        title={selectedCar ? `${selectedCar.title || 'Unnamed Car'}` : ''}
      >
        {selectedCar && (
          <ShippingControls 
            car={selectedCar} 
            onUpdate={handleCarUpdate}
          />
        )}
      </Blade>
    </Container>
  );
};

export default ShippingDashboardPage; 