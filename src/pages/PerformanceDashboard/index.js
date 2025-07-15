import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import DateRangeSelector from '../../components/DateRangeSelector';
import history from '../../utilities/history';
import moment from 'moment';
import firebase from '../../utilities/firebase.js';
import { StateManager } from "../../utilities/stateManager.js";
import constants from '../../utilities/constants.js';
import Performance from './Performance.js';

export default function PerformanceDashboard(props) {
  // Parse date range from URL params or use current month as default
  const { startMonth, endMonth, month } = props.match.params;
  
  // Handle both old single month format and new date range format
  let defaultStartDate, defaultEndDate;
  
  if (startMonth && endMonth) {
    // New date range format
    defaultStartDate = moment(startMonth).startOf('month');
    defaultEndDate = moment(endMonth).endOf('month');
  } else if (month) {
    // Old single month format - convert to date range
    defaultStartDate = moment(month).startOf('month');
    defaultEndDate = moment(month).endOf('month');
  } else {
    // Default to current month
    defaultStartDate = moment().startOf('month');
    defaultEndDate = moment().endOf('month');
  }
  
  const [startDate, setStartDate] = React.useState(defaultStartDate.toDate());
  const [endDate, setEndDate] = React.useState(defaultEndDate.toDate());
  const [payload, setPayload] = React.useState([]);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingStatus, setLoadingStatus] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  StateManager.setTitle("Performance Dashboard - " + moment(startDate).format("MMM YYYY") + " to " + moment(endDate).format("MMM YYYY"));

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingStatus('Initializing...');
      
      try {
        const db = firebase.firestore();
        
        // Generate array of months between start and end date
        const months = [];
        let current = moment(startDate).startOf('month');
        const end = moment(endDate).endOf('month');
        
        while (current.isSameOrBefore(end, 'month')) {
          months.push(current.format('YYYY-MM'));
          current = current.clone().add(1, 'month');
        }
        
        setLoadingStatus(`Fetching data for ${months.length} month${months.length > 1 ? 's' : ''}...`);
        
        // Fetch all data concurrently for all months
        const allMonthPromises = months.map(async (month, monthIndex) => {
          const monthStart = moment(month).startOf('month');
          const monthEnd = moment(month).endOf('month');
          
          // Update progress for each month
          const progress = ((monthIndex + 1) / months.length) * 100;
          setLoadingProgress(progress);
          setLoadingStatus(`Processing ${moment(month).format('MMM YYYY')}...`);
          
          // Fetch all collections concurrently for this month
          const [
            dealsSnap,
            shippingSnap,
            shippingInSnap,
            financeSnap,
            serviceSnap
          ] = await Promise.all([
            db.collection('deals').where('month', '==', month).get(),
            db.collection('deals').where('shipping_month', '==', month).get(),
            db.collection('deals').where('shipping_in_month', '==', month).get(),
            db.collection('deals').where('month', '==', month).where("is_finance", "==", true).get(),
            db.collection('orders')
              .where('complete_date', '>=', month)
              .where('complete_date', '<', moment(month).add(1, "month").format("YYYY-MM"))
              .get()
          ]);

          // Process all data types concurrently
          const [
            dealData,
            shippingData,
            shippingInData,
            financeData,
            transactionData,
            serviceData,
            periodPurchases,
            mechLabor,
            shippingLoadsData
          ] = await Promise.all([
            getDealData(dealsSnap, db, month, monthEnd),
            getData(shippingSnap, db, "shipping", month, monthEnd),
            getData(shippingInSnap, db, "shipping_in", month, monthEnd),
            getData(financeSnap, db, "finance", month, monthEnd),
            getTransactionData(dealsSnap, db, monthStart, monthEnd),
            getServiceData(serviceSnap, db, month, monthStart, monthEnd),
            getPeriodPurchases(db, monthStart, monthEnd),
            getMechLabor(db, monthStart, monthEnd),
            getShippingLoadsData(db, monthStart, monthEnd)
          ]);

          return [
            ...dealData,
            ...shippingData,
            ...shippingInData,
            ...financeData,
            ...transactionData,
            ...serviceData,
            ...periodPurchases,
            ...mechLabor,
            ...shippingLoadsData
          ];
        });

        // Wait for all months to complete
        const allMonthResults = await Promise.all(allMonthPromises);
        const allData = allMonthResults.flat();
        
        setPayload(allData);
        setLoadingProgress(100);
        setLoadingStatus('Complete!');
        
        // Clear loading status after a brief delay
        setTimeout(() => {
          setIsLoading(false);
          setLoadingStatus('');
        }, 500);

      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data. Please try again.');
        setIsLoading(false);
        setLoadingStatus('');
      }
    }

    // Helper functions moved outside the main function for better organization
    async function getDealData(dealsSnap, db, month, monthEnd) {
      const promises = dealsSnap.docs.map(async (doc, i) => {
        let data = doc.data();
        data.id = doc.id;
        data.stock = doc.id;
        data.type = "deal";

        // Fetch all related data concurrently
        const [carSnap, customerSnap, invoiceSnap, depositSnap, tradeSnap, expenseSnap, ntoSnap] = await Promise.all([
          db.doc('cars/'+doc.id).get(),
          db.doc('customers/'+data.buyer).get(),
          db.doc('invoices/'+data.invoice).get(),
          db.collection('deposits').where('stock', '==', doc.id).get(),
          db.collection('trades').where('stock', '==', doc.id).get(),
          db.collection('purchases').where('stock', '==', doc.id).get(),
          db.doc('purchases/'+doc.id+"-NTO").get()
        ]);

        // Process car data
        data.car = carSnap.exists ? carSnap.data() : {};
        data.carTitle = `${data.car.year || ''} ${data.car.make || ''} ${data.car.model || ''}`;
        data.nto_amount = data.car.nto || 0;
        data.updated_nto = data.car.updated_nto || 0;
        data.nto_profit = data.nto_amount - data.updated_nto;

        // Process customer data
        data.customer = customerSnap.exists ? customerSnap.data() : {};
        data.state = data.customer.state || "";
        data.outOfState = data.state !== "FL" ? "out of state" : false;
        data.inState = data.state === "FL" ? "in state" : false;

        // Process invoice data
        data.invoice = invoiceSnap.exists ? invoiceSnap.data() : {};
        data.revenue = data.invoice.revenue || 0;

        // Process deposits
        const [dep_pass, dep_fail_ship] = depositSnap.docs.map(snap => snap.data()).partition(x => x.type === "shipping");
        const [dep_pass_in, dep_fail] = dep_fail_ship.partition(x => x.type === "shipping_in");
        const [dep_finance, dep_regular] = dep_fail.partition(x => x.type === "finance");
        data.deposits = dep_regular.map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);

        // Process trades
        data.trades = tradeSnap.docs.map(trade => trade.data());

        // Process expenses
        const [pass, fail_ship] = expenseSnap.docs.map(snap => snap.data()).partition(x => x.type === "shipping");
        const [pass_in, fail] = fail_ship.partition(x => x.type === "shipping_in");
        const [finance, regular] = fail.partition(x => x.type === "finance");
        data.expenses = regular;
        data.cogs = data.expenses.map(expense => expense.amount).reduce((a,c) => a + c, 0);
        data.unpaid = data.expenses.filter(x => x.isPayable).reduce((a,c) => a + c.amount, 0);

        // Process NTO
        data.nto = ntoSnap.exists ? ntoSnap.data() : {};

        // Calculate additional fields
        data.netTrade = data.trades.reduce((a,c) => a + (c.trade || 0), 0);
        data.sales = data.invoice.cashPrice + (data.invoice.docFee || 0);
        data.exemption = data.invoice.salesTax + data.invoice.surtax <= 0 ? data.sales : data.netTrade;
        data.basis = Math.max(0, data.sales - data.exemption);
        data.excess = Math.max(0, data.basis - 5000);
        data.tax_rate = (100 * (data.invoice.salesTax + data.invoice.surtax) / ((data.sales - data.netTrade) || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})+"%";

        data.payables = data.expenses.filter(x => moment(x.paidDate).isAfter(monthEnd, 'month') || x.isPayable)
                                .filter(x => (x.memo || "").includes("NTO"))
                                .reduce((a,c) => a + (data.updated_nto || c.amount), 0);

        data.profit = data.revenue - data.cogs;
        const protected_factor = month <= "2024-04" ? 1.00 : 1.00;
        data.protected_cogs = data.cogs*protected_factor;
        data.protected_profit = Math.max(0, data.revenue - data.protected_cogs);
        data.ship_profit = data.ship_revenue - data.ship_cogs;
        data.rowLink = `../car/${data.stock}`;

        return data;
      });

      return Promise.all(promises);
    }

    async function getData(snaps, db, type, month, monthEnd) {
      const promises = snaps.docs.map(async (doc, i) => {
        let data = doc.data();
        data.id = doc.id;
        data.stock = doc.id;
        data.type = type;

        // Fetch related data concurrently
        const [carSnap, invoiceSnap, depositSnap, expenseSnap] = await Promise.all([
          db.doc('cars/'+doc.id).get(),
          db.doc('invoices/'+data[type]).get(),
          db.collection('deposits').where('stock', '==', doc.id).get(),
          db.collection('purchases').where('stock', '==', doc.id).get()
        ]);

        data.car = carSnap.exists ? carSnap.data() : {};
        data.carTitle = `${data.car.year || ''} ${data.car.make || ''} ${data.car.model || ''}`;

        data.invoice = invoiceSnap.exists ? invoiceSnap.data() : {};
        data.revenue = data.invoice.price || 0;

        const [dep_pass, dep_fail] = depositSnap.docs.map(snap => snap.data()).partition(x => x.type === type);
        data.deposits = dep_pass.map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);
        data.transfer_deposits = dep_pass.filter(doc => doc.memo.includes("TFD")).map(doc => doc.amount || 0).reduce((a,c) => a + c, 0);

        const [pass, fail] = expenseSnap.docs.map(snap => snap.data()).partition(x => x.type === type);
        data.expenses = pass;
        data.cogs = data.expenses.map(expense => expense.amount).reduce((a,c) => a + c, 0);
        data.unpaid = data.expenses.filter(x => x.isPayable).reduce((a,c) => a + c.amount, 0);

        data.payables = data.expenses.filter(x => moment(x.paidDate).isAfter(monthEnd, 'month') || x.isPayable)
                                .filter(x => (x.memo || "").includes("NTO"))
                                .reduce((a,c) => a + (data.car.updated_nto || c.amount), 0);

        data.profit = data.revenue - data.cogs;
        data.rowLink = `../car/${data.stock}`;
        data.isCurrentPeriod = moment(data.date).isSameOrAfter(moment(month).startOf('month'), 'month') && moment(data.date).isSameOrBefore(monthEnd, 'month');
        data.isPriorPeriod = moment(data.date).isBefore(moment(month).startOf('month'), 'month');
        data.isFuturePeriod = !data.date || moment(data.date).isAfter(monthEnd, 'month');

        return data;
      });

      return Promise.all(promises);
    }
    
    async function getTransactionData(dealsSnap, db, monthStart, monthEnd) {
      const trasnactionSnap = await db.collection('purchases')
        .where('paidDate', '>=', monthStart.format("YYYY/MM/DD"))
        .where('paidDate', '<=', monthEnd.format("YYYY/MM/DD"))
        .get();
      
      const currentDeals = dealsSnap.docs.map(x => x.id);
      const transactions = trasnactionSnap.docs.map((doc, i) => doc.data());
      let paidCars = transactions.filter(x => (x.memo || "").includes("NTO"))
                  .filter(x => !x.isPayable)
                  .filter(x => !currentDeals.includes(x.stock))
                  .map(x => x.stock);
                  
      paidCars = new Set(paidCars);
      
      const paidCarAmounts = [...paidCars].map(async (stock, i) => {
        const relevantTransactions = transactions.filter(x => x.stock === stock);
        const carSnap = await db.doc('cars/'+stock).get();
        const carData = carSnap.data() || {};
        const updatedNTO = carData.updated_nto || 0;
        const paid = relevantTransactions.filter(x => (x.memo || "").includes("NTO")).reduce((a,c) => a + (updatedNTO || c.amount), 0);
        const dates = relevantTransactions.map(x => moment(x.date));
        const date = moment.max(dates).format("MM-DD-YYYY");
        
        return {
          stock,
          paid,
          date,
          type: "paid"
        }
      });

      return Promise.all(paidCarAmounts);
    }

    async function getPeriodPurchases(db, monthStart, monthEnd) {
      const trasnactionSnap = await db.collection('purchases')
        .where('paidDate', '>=', monthStart.format("YYYY/MM/DD"))
        .where('paidDate', '<=', monthEnd.format("YYYY/MM/DD"))
        .get();
      
      const transactions = trasnactionSnap.docs.map((doc, i) => doc.data()).map(x => ({...x, type: "period_purchase"}));
      return transactions;
    }

    async function getMechLabor(db, monthStart, monthEnd) {
      const laborSnap = await db.collection('services')
        .where('status', '==', constants.service_statuses.at(-1))
        .where('status_time', '>=', monthStart.format("YYYY/MM/DD"))
        .where('status_time', '<=', monthEnd.format("YYYY/MM/DD"))
        .get();
      
      const transactions = laborSnap.docs.map((doc, i) => doc.data()).map(x => ({...x, type: "labor"}));
      return transactions;
    }

    async function getServiceData(serviceSnap, db, month, monthStart, monthEnd) {
      let promises = serviceSnap.docs.map(async (doc, i) => {
        const order = {...doc.data(), id: doc.id};
        const {revenue = 0} = order;

        let car = "";
        let car_stock = null;
        let car_data = null;
        let deal_data = null;
        
        if(order.car){
          const [carDoc, dealDoc] = await Promise.all([
            db.doc(`cars/${order.car}`).get(),
            db.doc(`deals/${order.car}`).get()
          ]);
          
          car_stock = carDoc.id;
          car_data = carDoc.data() || {};
          car = `${car_data.year || ''} ${car_data.make || ''} ${car_data.model || ''}`;
          deal_data = dealDoc.data() || {};
        } else {
          car = "No car"
        }

        const [customerDoc, depositsSnap, servicesSnap, expensesSnap] = await Promise.all([
          db.doc(`customers/${order.customer}`).get(),
          db.collection(`deposits`).where("stock", "==", order.id).get(),
          db.collection("services").where("order", "==", order.id).get(),
          db.collection("purchases").where("stock", "==", order.id).get()
        ]);

        const customer = customerDoc.data();
        const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`;

        const deposits = depositsSnap.docs.map(doc => ({...doc.data(), id: doc.id}));
        const depositsTotal = deposits.reduce((a,c) => a + (c.amount || 0), 0);
        const receivable = revenue - depositsTotal;

        const services = servicesSnap.docs.map(doc => ({...doc.data(), id: doc.id}));
        const expenses = expensesSnap.docs.map(doc => ({...doc.data(), id: doc.id}));

        const labor_value = services.reduce((a,c) => a + (c.cost || 0), 0);
        const purchase_value = expenses.reduce((a,c) => a + (c.amount || 0), 0);
        const cost = labor_value + purchase_value;
        const profit = revenue - cost;

        const isCurrentPeriod = moment(deal_data?.date).isSameOrAfter(monthStart, 'month') && moment(deal_data?.date).isSameOrBefore(monthEnd, 'month');
        const isPriorPeriod = moment(deal_data?.date).isBefore(monthStart, 'month');
        const isFuturePeriod = !deal_data?.date || moment(deal_data?.date).isAfter(monthEnd, 'month');
      
        return {
          ...order,
          revenue,
          receivable,
          profit,
          cost,
          car,
          car_stock: car_stock,
          car_data,
          deal_data,
          customer: customerName,
          deposits: depositsTotal,
          rowLink: `/service-order/${order.id}`,
          type: "service",
          isCurrentPeriod,
          isPriorPeriod,
          isFuturePeriod
        };
      });
      
      return Promise.all(promises);
    }

    async function getShippingLoadsData(db, monthStart, monthEnd) {
      // Fetch completed shipping loads for the period
      const loadsSnap = await db.collection('shipping-loads')
        .where('completed_at', '>=', monthStart.toISOString())
        .where('completed_at', '<=', monthEnd.toISOString())
        .get();

      const loadsData = loadsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process each load to calculate revenue, cost, and profit
      const processedLoads = await Promise.all(loadsData.map(async (load) => {
        // Fetch purchases for this load
        const purchasesSnap = await db.collection('purchases')
          .where('stock', '==', load.id)
          .get();

        const additionalCost = purchasesSnap.docs.reduce((total, doc) => {
          const purchase = doc.data();
          return total + (purchase.amount || 0);
        }, 0);

        // Calculate revenue from cars in the load
        const revenue = load.cars ? load.cars.reduce((total, car) => {
          return total + (car.charge || 0);
        }, 0) : 0;

        // Calculate cost (miles * cost per mile + additional costs)
        const costPerMile = load.cost_per_mile || 0;
        const totalMiles = load.total_miles || 0;
        const cost = totalMiles * costPerMile + additionalCost;

        // Calculate profit
        const profit = revenue - cost;

        return {
          ...load,
          stock: load.id,
          type: "shipping_load",
          revenue,
          cost,
          profit,
          additional_cost: additionalCost,
          car_count: load.cars ? load.cars.length : 0,
          date: load.completed_at,
          rowLink: `/load/${load.id}`,
          isCurrentPeriod: true,
          isPriorPeriod: false,
          isFuturePeriod: false
        };
      }));

      return processedLoads;
    }

    fetchData();
  }, [startDate, endDate]);

  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Update URL
    const startMonth = moment(newStartDate).format("YYYY-MM");
    const endMonth = moment(newEndDate).format("YYYY-MM");
    const url = new URL(window.location.href);
    history.push(`/performance-dashboard/${startMonth}/${endMonth}${url.search}`);
  };

  return (
    <>
      <Grid container spacing={3} sx={{ p: 3 }}>
        <Grid item xs={12}>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
            title="Performance Analytics"
            showQuickSelectors={true}
          />
        </Grid>
        
        {/* Loading Progress */}
        {isLoading && (
          <Grid item xs={12}>
            <Box sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {loadingStatus}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(loadingProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={loadingProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    borderRadius: 4
                  }
                }} 
              />
            </Box>
          </Grid>
        )}

        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Performance Data */}
        <Grid item xs={12}>
          <Performance data={payload} loading={isLoading} />
        </Grid>
      </Grid>
    </>
  );
}
