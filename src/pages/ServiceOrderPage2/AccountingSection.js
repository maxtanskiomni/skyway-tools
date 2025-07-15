import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  styled,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { StateManager } from '../../utilities/stateManager';
import firebase from '../../utilities/firebase';
import Transactions from '../ServiceOrderPage/Transactions';
import PaymentLine from '../../components/PaymentLine';
import ProfitSummary from '../ServiceOrderPage/ProfitSummary';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const MetricCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: alpha(theme.palette.background.paper, 0.7),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const MetricValue = styled(Typography)(({ theme, color = 'text.primary' }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette[color]?.main || theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const SubMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginTop: theme.spacing(1),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 600,
}));

const StyledTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    background: alpha(theme.palette.primary.main, 0.05),
    fontWeight: 600,
  },
}));

export default function AccountingSection({ order, stockNumber, disabled }) {
  const theme = useTheme();
  const [revenue, setRevenue] = React.useState(order.revenue || 0);

  // Calculate totals
  const depositsAmount = (order.deposits || []).reduce((a, c) => a + (c.amount || 0), 0);
  const services = (order.services || []).map(x => ({ amount: (x.cost || 0) }));
  const purchases = (order.expenses || []).map(x => ({ amount: (x.amount || 0) }));
  const servicesTotal = services.reduce((a, c) => a + (c.amount || 0), 0);
  const purchasesTotal = purchases.reduce((a, c) => a + (c.amount || 0), 0);
  const totalExpenses = servicesTotal + purchasesTotal;
  const profit = revenue - totalExpenses;
  const amountOwed = revenue - depositsAmount;
  const paymentProgress = (depositsAmount / revenue) * 100;

  const handleRevenueChange = async (e) => {
    const value = e.target.value;
    const numericValue = Number(value.replace(/,/g, "").replace("$", ""));
    
    if (!isNaN(numericValue)) {
      setRevenue(numericValue);
      StateManager.setPaymentLineAmount(numericValue - depositsAmount);
      await firebase.firestore().doc(`orders/${stockNumber}`).update({ revenue: numericValue });
      StateManager.updateOrder({ revenue: numericValue });
    }
  };

  if (!StateManager.isBackoffice()) {
    return null;
  }

  return (
    <>
      {/* Header Section */}
      <Box sx={{ mb: 2, mt: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <ReceiptIcon color="primary" fontSize="small" />
            Financial Overview
          </Typography>
          <Stack direction="row" spacing={2}>
            <ActionButton
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/payment?stock=${stockNumber}`)}
            >
              Copy Payment Link
            </ActionButton>
            <ActionButton
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {/* Implement send payment link */}}
            >
              Send Payment Link
            </ActionButton>
          </Stack>
        </Stack>

        {/* Key Metrics */}
        <Grid container spacing={4} sx={{ mt: 0, mb: 1 }}>
          {/* Revenue Card */}
          <Grid item xs={12} md={3}>
            <MetricCard>
              <MetricValue color="primary">
                <MonetizationOnIcon />
                ${revenue.toLocaleString()}
              </MetricValue>
              <MetricLabel>Total Revenue</MetricLabel>
              <TextField
                fullWidth
                size="small"
                value={`$${revenue.toLocaleString()}`}
                onChange={handleRevenueChange}
                disabled={disabled}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </MetricCard>
          </Grid>

          {/* Deposits & Amount Owed Card */}
          <Grid item xs={12} md={3}>
            <MetricCard>
              <MetricValue color="success">
                <AccountBalanceIcon />
                ${depositsAmount.toLocaleString()}
              </MetricValue>
              <MetricLabel>Total Deposits</MetricLabel>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={paymentProgress} 
                  color={paymentProgress >= 100 ? "success" : "primary"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {paymentProgress.toFixed(1)}% Paid
                </Typography>
              </Box>
              <SubMetric>
                <Typography variant="body2" color="text.secondary">
                  Amount Owed
                </Typography>
                <Typography 
                  variant="body1" 
                  fontWeight="600"
                  color={amountOwed > 0 ? "error" : "success"}
                >
                  ${amountOwed.toLocaleString()}
                </Typography>
              </SubMetric>
            </MetricCard>
          </Grid>

          {/* Expenses Card */}
          <Grid item xs={12} md={3}>
            <MetricCard>
              <MetricValue color="error">
                <AttachMoneyIcon />
                ${totalExpenses.toLocaleString()}
              </MetricValue>
              <MetricLabel>Total Expenses</MetricLabel>
              <Box sx={{ mt: 2 }}>
                <SubMetric>
                  <Typography variant="body2" color="text.secondary">
                    Services
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ${servicesTotal.toLocaleString()}
                  </Typography>
                </SubMetric>
                <SubMetric>
                  <Typography variant="body2" color="text.secondary">
                    Purchases
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ${purchasesTotal.toLocaleString()}
                  </Typography>
                </SubMetric>
              </Box>
            </MetricCard>
          </Grid>

          {/* Profit Card */}
          <Grid item xs={12} md={3}>
            <MetricCard>
              <MetricValue color={profit >= 0 ? "success" : "error"}>
                <TrendingUpIcon />
                ${profit.toLocaleString()}
              </MetricValue>
              <MetricLabel>Estimated Profit</MetricLabel>
              <Box sx={{ mt: 2 }}>
                <SubMetric>
                  <Typography variant="body2" color="text.secondary">
                    Revenue
                  </Typography>
                  <Typography variant="body1" fontWeight="600" color="primary">
                    ${revenue.toLocaleString()}
                  </Typography>
                </SubMetric>
                <SubMetric>
                  <Typography variant="body2" color="text.secondary">
                    Expenses
                  </Typography>
                  <Typography variant="body1" fontWeight="600" color="error">
                    ${totalExpenses.toLocaleString()}
                  </Typography>
                </SubMetric>
              </Box>
            </MetricCard>
          </Grid>
        </Grid>
      </Box>
    </>
  );
} 