import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import moment from 'moment';

const MetricCard = ({ title, value, subtitle, color }) => (
  <Paper elevation={3} sx={{ p: 2, height: '100%', borderLeft: color ? `4px solid ${color}` : 'none' }}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ mb: 1, color: color }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const TransactionTable = ({ transactions, columns }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map(column => (
            <TableCell 
              key={column.key}
              align={column.format ? 'right' : 'left'}
            >
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {transactions.map((transaction, index) => (
          <TableRow key={transaction.id || index}>
            {columns.map(column => (
              <TableCell 
                key={column.key}
                align={column.format ? 'right' : 'left'}
              >
                {column.format ? column.format(transaction[column.key]) : transaction[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const TransactionAccordion = ({ title, amount, transactions, columns }) => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Typography variant="body1" sx={{ textAlign: 'left' }}>{title}</Typography>
        <Typography 
          variant="body1" 
          color={amount >= 0 ? "#4caf50" : "#f44336"} 
          sx={{ textAlign: 'right' }}
        >
          {amount >= 0 
            ? formatCurrency(amount)
            : `(${formatCurrency(Math.abs(amount))})`
          }
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      {transactions.length > 0 ? (
        <TransactionTable transactions={transactions} columns={columns} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No transactions for this period
        </Typography>
      )}
    </AccordionDetails>
  </Accordion>
);

const DepartmentSection = ({ title, items }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ textAlign: 'left' }}>
      {title}
    </Typography>
    <Box sx={{ pl: 2 }}>
      {items.map((item, index) => (
        <TransactionAccordion key={index} {...item} />
      ))}
    </Box>
  </Box>
);

export default function Performance({ data }) {
  // Calculate metrics for each section
  const sales = data.filter(x => x.type === "deal");
  const service = data.filter(x => x.type === "service");
  const shipping = data.filter(x => x.type === "shipping" || x.type === "shipping_in");
  const finance = data.filter(x => x.type === "finance");
  const periodPurchases = data.filter(x => x.type === "period_purchase" && !(x.memo || "").includes("TFD"));
  const mechLabor = data.filter(x => x.type === "labor" && !service.some(order => order.stock === x.order));
  const ownedVehicles = sales.filter(x => (x?.car?.consignor || "").trim() === "9c0d88f5-84f9-454d-833d-a8ced9adad49" && !x.isFuturePeriod)
  const payables = data.filter(x => x.type === "deal" && x.payables > 0).sort((a,b) => +b.stock.replace(/-.+/, "") - a.stock.replace(/-.+/, ""));
  const paid = data.filter(x => x.type === "paid").sort((a,b) => +b.stock.replace(/-.+/, "") - a.stock.replace(/-.+/, ""));
  
  // Calculate revenue and profit for each section
  const salesRevenue = sales.reduce((sum, deal) => sum + (deal.revenue || 0), 0);
  const ntoProfit = sales.filter(x => x.updated_nto > 0).reduce((sum, deal) => sum + (deal.nto_profit || 0), 0);
  const salesProfit = sales.reduce((sum, deal) => sum + (deal.profit || 0), 0) + ntoProfit;
  
  const serviceRevenue = service.reduce((sum, order) => sum + (order.revenue || 0), 0);
  const serviceProfit = service.reduce((sum, order) => sum + (order.profit || 0), 0);
  
  const shippingRevenue = shipping.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const shippingProfit = shipping.reduce((sum, item) => sum + (item.profit || 0), 0);
  
  const financeRevenue = finance.reduce((sum, item) => sum + (item.invoice.total || 0), 0);
  const financeProfit = finance.reduce((sum, item) => sum + (item.invoice.total || 0), 0);

  // Calculate internal transfers and trades for each department
  const ownedVehicleValue = ownedVehicles.reduce((a,c) => a + c.cogs, 0);
  const salesTrades = sales.reduce((sum, deal) => {
    const tradeAmount = (deal.trades || []).reduce((tradeSum, trade) => tradeSum + (trade.netTrade || 0), 0);
    return sum + tradeAmount;
  }, 0);

  const serviceTransfers = service.filter(x => x.customer.trim() === "Skyway Classics" && x.isFuturePeriod).reduce((a,c) => a + c.profit, 0);
  const shippingTransfers = shipping.filter(x => x.type === "shipping_in" && x.isFuturePeriod).reduce((sum, item) => sum + (item.transfer_deposits || 0), 0);
  const financeTransfers = finance.reduce((sum, item) => sum + (item.transfer_deposits || 0), 0);

  // Calculate mechanic labor total
  const mechLaborTotal = mechLabor.reduce((sum, item) => sum + (item.cost || 0), 0);

  // Calculate purchases for each department
  const [nonTrackedPurchases, trackedPurchases] = periodPurchases.partition(x => !x.stock);
  const salesPurchases = trackedPurchases.filter(x => !sales.some(deal => deal.stock === x.stock)).filter(x => x.stock.includes("SN") && !x.memo.includes("NTO") && !x.memo.includes("SO") && !x.memo.includes("Trade equity") && !x.memo.includes("Transfer") && !x.memo.includes("Shipping"));
  const servicePurchases = trackedPurchases.filter(x => !service.some(order => order.stock === x.stock)).filter(x => x.stock.includes("SO"));

  const salesPurchasesTotal = salesPurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
  const servicePurchasesTotal = servicePurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
  const nonTrackedPurchasesTotal = nonTrackedPurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);

  // Calculate NTO financing 
  const payablesAmount = payables.reduce((sum, deal) => sum + (deal.payables || 0), 0);
  const paidNTOAmount = paid.reduce((sum, deal) => sum + (deal.paid || 0), 0);

  // Calculate total gross profit and cash flow
  const totalGrossProfit = salesProfit + serviceProfit + shippingProfit + financeProfit;
  const totalCashFlow = totalGrossProfit + (ownedVehicleValue + payablesAmount) - (salesTrades + salesPurchasesTotal + serviceTransfers + servicePurchasesTotal + mechLaborTotal + shippingTransfers +  nonTrackedPurchasesTotal + paidNTOAmount);

  // Calculate counts for each department
  const salesCount = sales.length;
  const serviceCount = service.length;
  const shippingCount = shipping.length;
  const financeCount = finance.length;

  // Calculate cash flow for each department
  const salesCashFlow = salesProfit - (salesTrades + salesPurchasesTotal);
  const serviceCashFlow = serviceProfit - (serviceTransfers + servicePurchasesTotal + mechLaborTotal);
  const shippingCashFlow = shippingProfit - shippingTransfers;
  const financeCashFlow = financeProfit;

  // Calculate bank spiffs
  const bankSpiffs = financeProfit - financeTransfers;


  // Define department sections
  const departmentSections = [
    {
      title: "Sales Department",
      items: [
        {
          title: "Trades",
          amount: -salesTrades,
          transactions: sales.filter(deal => (deal.trades || []).length > 0).flatMap(deal => 
            deal.trades.map(trade => ({
              date: deal.date,
              stock: deal.stock,
              tradeTitle: `${trade.year || ""} ${trade.make || ""} ${trade.model || ""}`,
              carTitle: deal.carTitle,
              amount: trade.netTrade
            }))
          ),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'carTitle', label: 'Sold car' },
            { key: 'tradeTitle', label: 'Trade' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        },
        {
          title: `Purchases (${salesPurchases.length} transactions)`,
          amount: -salesPurchasesTotal,
          transactions: salesPurchases,
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'memo', label: 'Memo' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        },
        {
          title: `Owned Vehicles (${ownedVehicles.length} transactions)`,
          amount: ownedVehicleValue,
          transactions: ownedVehicles,
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'carTitle', label: 'Car' },
            { key: 'cogs', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    },
    {
      title: "Service Department",
      items: [
        {
          title: "Work completed on non-sold cars",
          amount: -serviceTransfers,
          transactions: service.filter(x => x.customer.trim() === "Skyway Classics" && x.isFuturePeriod).map(order => ({
            stock: order.car_stock,
            date: order.date,
            car: order.car,
            amount: order.revenue
          })),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'car', label: 'Car' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        },
        {
          title: `Parts purchases (${servicePurchases.length} transactions)`,
          amount: -servicePurchasesTotal,
          transactions: servicePurchases,
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'memo', label: 'Memo' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        },
        {
          title: `Mechanic labor (${mechLabor.length} transactions)`,
          amount: -mechLaborTotal,
          transactions: mechLabor,
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'order', label: 'Stock' },
            { key: 'name', label: 'Memo' },
            { key: 'cost', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    },
    {
      title: "Shipping Department",
      items: [
        {
          title: "Transport of vehicles to Skyway Classics",
          amount: -shippingTransfers,
          transactions: shipping.filter(x => x.type === "shipping_in" && x.isFuturePeriod)
            .sort((a, b) => moment(a.shipping_in_date).diff(moment(b.shipping_in_date)))
            .map(item => ({
              stock: item.stock,
              date: item.shipping_in_date,
              carTitle: item.carTitle,
              amount: item.transfer_deposits
            })),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'carTitle', label: 'Car' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    },
    {
      title: "Finance Department",
      items: [
        {
          title: "Transfers",
          amount: 0,
          transactions: [],
          columns: [
            { key: 'stock', label: 'Stock' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    },
    {
      title: "Non-Tracked Purchases",
      items: [
        {
          title: `Purchases (${nonTrackedPurchases.length} transactions)`,
          amount: -nonTrackedPurchasesTotal,
          transactions: nonTrackedPurchases.sort((a, b) => moment(a.date).diff(moment(b.date))),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'memo', label: 'Memo' },
            { key: 'amount', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    },
    {
      title: "NTO Financing",
      items: [
        {
          title: `New NTOs (${payables.length} transactions)`,
          amount: payablesAmount,
          transactions: payables.sort((a, b) => moment(a.date).diff(moment(b.date))),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'payables', label: 'Payables', format: formatCurrency }
          ]
        },
        {
          title: `Paid NTOs (${paid.length} transactions)`,
          amount: -paidNTOAmount,
          transactions: paid.sort((a, b) => moment(a.date).diff(moment(b.date))),
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'stock', label: 'Stock' },
            { key: 'paid', label: 'Amount', format: formatCurrency }
          ]
        }
      ]
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Performance Metrics
          </Typography>
        </Grid>
        
        {/* Sales Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Sales Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Sales Revenue"
                value={formatCurrency(salesRevenue)}
                subtitle={`${salesCount} deals`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Sales Gross Profit"
                value={formatCurrency(salesProfit)}
                subtitle={`${formatCurrency(salesCount > 0 ? salesProfit / salesCount : 0)} per deal`}
              />
            </Grid>
            <Grid item xs={12}>
              <MetricCard
                title="Sales Cash Flow"
                value={formatCurrency(salesCashFlow)}
                subtitle={`After ${formatCurrency(salesTrades)} of trades and ${formatCurrency(ntoProfit)} of NTO Reductions`}
                color={salesCashFlow >= 0 ? "#4caf50" : "#f44336"}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Service Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Service Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Service Revenue"
                value={formatCurrency(serviceRevenue)}
                subtitle={`${serviceCount} orders`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Service Gross Profit"
                value={formatCurrency(serviceProfit)}
                subtitle={`${formatCurrency(serviceCount > 0 ? serviceProfit / serviceCount : 0)} per order`}
              />
            </Grid>
            <Grid item xs={12}>
              <MetricCard
                title="Service Cash Flow"
                value={formatCurrency(serviceCashFlow)}
                subtitle={`After ${formatCurrency(serviceTransfers)} of profit on inventory cars and ${formatCurrency(servicePurchasesTotal)} of parts purchases and ${formatCurrency(mechLaborTotal)} of mechanic labor`}
                color={serviceCashFlow >= 0 ? "#4caf50" : "#f44336"}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Shipping Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Shipping Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Shipping Revenue"
                value={formatCurrency(shippingRevenue)}
                subtitle={`${shippingCount} shipments`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Shipping Gross Profit"
                value={formatCurrency(shippingProfit)}
                subtitle={`${formatCurrency(shippingCount > 0 ? shippingProfit / shippingCount : 0)} per shipment`}
              />
            </Grid>
            <Grid item xs={12}>
              <MetricCard
                title="Shipping Cash Flow"
                value={formatCurrency(shippingCashFlow)}
                subtitle={`After ${formatCurrency(shippingTransfers)} of shipping unsold cars to Skyway Classics`}
                color={shippingCashFlow >= 0 ? "#4caf50" : "#f44336"}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Finance Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Finance Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Finance Revenue"
                value={formatCurrency(financeRevenue)}
                subtitle={`${financeCount} transactions`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MetricCard
                title="Finance Gross Profit"
                value={formatCurrency(financeProfit)}
                subtitle={`${formatCurrency(financeCount > 0 ? financeProfit / financeCount : 0)} per transaction`}
              />
            </Grid>
            <Grid item xs={12}>
              <MetricCard
                title="Finance Cash Flow"
                value={formatCurrency(financeCashFlow)}
                subtitle={`Including ${formatCurrency(bankSpiffs)} of bank spiffs`}
                color={financeCashFlow >= 0 ? "#4caf50" : "#f44336"}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ textAlign: 'left' }}>
            Cash Flow Analysis
          </Typography>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Grid container>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Gross Profit Section */}
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ textAlign: 'left' }}>
                      Gross Profit by Department
                    </Typography>
                    <Box sx={{ pl: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body1" sx={{ textAlign: 'left' }}>Sales</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ textAlign: 'right' }}>
                          {formatCurrency(salesProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body1" sx={{ textAlign: 'left' }}>Service</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ textAlign: 'right' }}>
                          {formatCurrency(serviceProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body1" sx={{ textAlign: 'left' }}>Shipping</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ textAlign: 'right' }}>
                          {formatCurrency(shippingProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body1" sx={{ textAlign: 'left' }}>Finance</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ textAlign: 'right' }}>
                          {formatCurrency(financeProfit)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ textAlign: 'left' }}>Total Gross Profit</Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ textAlign: 'right' }}>
                          {formatCurrency(totalGrossProfit)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Cash Allocation Section */}
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ textAlign: 'left' }}>
                      Cash Allocation by Department
                    </Typography>
                    <Box sx={{ pl: 3 }}>
                      {departmentSections.map((section, index) => (
                        <DepartmentSection key={index} {...section} />
                      ))}
                    </Box>
                  </Box>

                  {/* Net Cash Flow */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 3, borderTop: 2, borderColor: 'divider' }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ textAlign: 'left' }}>Net Cash Flow</Typography>
                    <Typography variant="h5" fontWeight="bold" color={totalCashFlow >= 0 ? "#4caf50" : "#f44336"} sx={{ textAlign: 'right' }}>
                      {totalCashFlow >= 0 
                        ? formatCurrency(totalCashFlow)
                        : `(${formatCurrency(Math.abs(totalCashFlow))})`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 