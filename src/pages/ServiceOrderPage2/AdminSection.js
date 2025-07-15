import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  InputAdornment,
  Stack,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Speed as SpeedIcon,
  ColorLens as ColorIcon,
  VpnKey as VinIcon,
  Assignment as StatusIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Launch as LaunchIcon,
  Receipt as ReceiptIcon,
  SwapHoriz as SwapIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import algolia from '../../utilities/algolia';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import { v4 as uuidv4 } from 'uuid';
import constants from '../../utilities/constants';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: `0 2px 12px 0 ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    boxShadow: `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.12)}`,
    transform: 'translateY(-2px)',
  }
}));

const CardHeaderStyled = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  '& .MuiCardHeader-title': {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  '& .MuiCardHeader-action': {
    margin: 0
  }
}));

const CardContentStyled = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(0, 3, 3),
  '&:last-child': {
    paddingBottom: theme.spacing(3)
  }
}));

const InfoChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  height: 32,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    fontSize: '0.875rem',
  },
  '& .MuiChip-icon': {
    color: theme.palette.primary.main,
    marginLeft: theme.spacing(1)
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    pending: theme.palette.warning.main,
    in_progress: theme.palette.info.main,
    completed: theme.palette.success.main,
    cancelled: theme.palette.error.main
  };
  
  return {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(statusColors[status] || theme.palette.grey[500], 0.1),
    color: statusColors[status] || theme.palette.grey[500],
    fontWeight: 500,
    '& .MuiChip-icon': {
      color: 'inherit'
    }
  };
});

const SearchField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'box-shadow 0.2s',
    '&:hover': {
      boxShadow: `0 2px 8px 0 ${alpha(theme.palette.common.black, 0.05)}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 2px 12px 0 ${alpha(theme.palette.primary.main, 0.1)}`,
    }
  }
}));

const ResultList = styled(List)(({ theme }) => ({
  maxHeight: 300,
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  marginTop: theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.common.black, 0.1),
    borderRadius: '4px',
    '&:hover': {
      background: alpha(theme.palette.common.black, 0.2),
    },
  },
}));

const ResultAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primary.main,
  '& img': {
    objectFit: 'cover'
  }
}));

const EditButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  width: 32,
  height: 32,
  padding: 0,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  transition: 'all 0.2s',
  '& .MuiSvgIcon-root': {
    fontSize: 18
  }
}));

const StatusButton = styled(Button)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  transition: 'all 0.2s',
}));

const NavigableTypography = styled(Typography)(({ theme }) => ({
  cursor: 'pointer',
  color: theme.palette.primary.main,
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.dark,
  },
  transition: 'all 0.2s',
}));

const SOHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2, 3),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const NavButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  transition: 'all 0.2s',
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  }
}));

export default function AdminSection({ order, stockNumber, disabled }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchType, setSearchType] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = React.useState(null);
  const [mechanicMenuAnchor, setMechanicMenuAnchor] = React.useState(null);

  const handleSearch = async (query, type) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const index = algolia.client.initIndex(type === 'car' ? 'cars' : 'customers');
    const { hits } = await index.search(query);
    
    const results = hits.map(hit => ({
      ...hit,
      action: () => handleSelect(hit, type),
      label: type === 'car' 
        ? `${hit.stock || ''} ${hit.year || ''} ${hit.make || ''} ${hit.model || ''}`
        : `${hit.first_name || ''} ${hit.last_name || ''}`
    }));

    const addNewEntry = {
      action: () => handleAddNew(type, query),
      label: `Add New ${type === 'car' ? 'Car' : 'Customer'}`
    };

    setSearchResults([addNewEntry, ...results]);
    setDialogOpen(true);
  };

  const handleSelect = async (item, type) => {
    if (type === 'car') {
      await setCar(stockNumber, item);
    } else {
      await setCustomer(stockNumber, item);
    }
    setDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddNew = (type, query) => {
    if (type === 'car') {
      const [year, make, model] = query.split(' ');
      const url = new URL(window.location.href);
      const redirect = url.pathname;
      history.push(`/form/add-car?stock=${stockNumber}&redirect=${redirect}&status=service&year=${year}&make=${make}&model=${model}`);
    } else {
      const [first_name, last_name] = query.split(' ');
      const customer = uuidv4();
      const url = new URL(window.location.href);
      const redirect = url.pathname;
      history.push(`/form/new-customer?redirect=${redirect}&stock=${stockNumber}&customer=${customer}&first_name=${first_name}&last_name=${last_name}`);
    }
    setDialogOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      searchResults[selectedIndex].action();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(searchResults.length - 1, prev + 1));
    } else if (e.key === 'Escape') {
      setDialogOpen(false);
    }
  };

  const openSearchDialog = (type) => {
    setSearchType(type);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedIndex(0);
    setDialogOpen(true);
  };

  const handleStatusClick = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = async (newStatus) => {
    const db = firebase.firestore();
    await db.doc('orders/'+stockNumber).update({
      status: newStatus
    });
    StateManager.updateOrder({ status: newStatus });
    handleStatusClose();
  };

  const handleMechanicMenuOpen = (event) => {
    setMechanicMenuAnchor(event.currentTarget);
  };

  const handleMechanicMenuClose = () => {
    setMechanicMenuAnchor(null);
  };

  const handleMechanicChange = async (mechanicId) => {
    const db = firebase.firestore();
    await db.doc('orders/'+stockNumber).update({
      mechanicId: mechanicId
    });
    StateManager.updateOrder({ mechanicId: mechanicId });
    handleMechanicMenuClose();
  };

  const getStatusColor = (status) => {
    const statusIndex = constants.order_statuses.indexOf(status);
    if (statusIndex === -1) return theme.palette.grey[500];

    // Create a progression from blue (start) to green (complete)
    const totalStatuses = constants.order_statuses.length;
    const progress = statusIndex / (totalStatuses - 1);

    // Use a color palette that progresses from blue to green, avoiding yellow/orange
    if (progress < 0.25) {
      return theme.palette.info.light; // Early stages - light blue
    } else if (progress < 0.5) {
      return theme.palette.info.main; // Planning stages - blue
    } else if (progress < 0.75) {
      return theme.palette.primary.main; // Middle stages - primary color
    } else {
      return theme.palette.success.main; // Final stages - green
    }
  };

  const getMechanicColor = (mechanicId) => {
    if (!mechanicId) return theme.palette.grey[500];
    
    // Create a consistent color mapping based on mechanic ID
    const colors = [
      theme.palette.primary.main,    // Blue
      theme.palette.success.main,    // Green
      theme.palette.info.main,       // Light Blue
      theme.palette.error.main,      // Red
      theme.palette.secondary.main,  // Purple
      theme.palette.warning.dark,    // Orange
      '#2E7D32',                    // Dark Green
      '#1976D2',                    // Dark Blue
      '#7B1FA2',                    // Dark Purple
      '#C2185B',                    // Pink
      '#00796B',                    // Teal
      '#5D4037',                    // Brown
      '#455A64',                    // Blue Grey
      '#D81B60',                    // Deep Pink
      '#00897B',                    // Teal
      '#5E35B1',                    // Deep Purple
    ];

    // Use the mechanic's index in the array to determine color
    const index = constants.mechanics.findIndex(m => m.id === mechanicId);
    if (index === -1) return theme.palette.grey[500];
    return colors[index % colors.length];
  };

  const formatStatus = (status) => {
    return status?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Not Set';
  };

  const handleCarClick = (e) => {
    e.stopPropagation();
    if (!order.car?.id) return;

    // If ctrl/cmd key is pressed, open in new tab
    if (e.metaKey || e.ctrlKey) {
      window.open(`/car/${order.car.id}`, '_blank');
      return;
    }
    history.push(`/car/${order.car.id}`);
  };

  const handleCustomerClick = (e) => {
    e.stopPropagation();
    if (!order.customer?.id) return;

    // If ctrl/cmd key is pressed, open in new tab
    if (e.metaKey || e.ctrlKey) {
      window.open(`/customer/${order.customer.id}`, '_blank');
      return;
    }
    history.push(`/customer/${order.customer.id}`);
  };

  const assignedMechanic = constants.mechanics.find(m => m.id === order.mechanicId);

  return (
    <Box sx={{ mb: 4 }}>
      {/* SO Number Header */}
      <SOHeader>
        <ReceiptIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {stockNumber}
        </Typography>
      </SOHeader>

      <Grid container spacing={3}>
        {/* Vehicle Card */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeaderStyled
              avatar={<CarIcon color="primary" />}
              title="Vehicle Information"
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View Vehicle Details (Hold Ctrl/Cmd to open in new tab)">
                    <NavButton
                      onClick={handleCarClick}
                      disabled={!order.car?.id}
                      startIcon={<LaunchIcon />}
                      size="small"
                    >
                      View
                    </NavButton>
                  </Tooltip>
                  <Tooltip title="Change Vehicle">
                    <EditButton
                      onClick={() => openSearchDialog('car')}
                      disabled={disabled}
                      size="small"
                    >
                      <SwapIcon />
                    </EditButton>
                  </Tooltip>
                </Stack>
              }
            />
            <CardContentStyled>
              <Stack spacing={2}>
                {order.car ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={order.car?.thumbnail}
                        sx={{ 
                          width: 64, 
                          height: 64,
                          backgroundColor: 'primary.main',
                          '& img': { objectFit: 'cover' }
                        }}
                      >
                        <CarIcon />
                      </Avatar>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                      >
                        {order.car?.title}
                      </Typography>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <InfoChip
                          icon={<VinIcon />}
                          label={order.car?.vin || 'Not Provided'}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoChip
                          icon={<ColorIcon />}
                          label={order.car?.color || 'Not Provided'}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoChip
                          icon={<SpeedIcon />}
                          label={order.car?.mileage ? 
                            `${order.car.mileage.toLocaleString()} miles` : 
                            'Not Provided'
                          }
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <InfoChip
                          icon={<StatusIcon />}
                          label={order.car?.status || 'Not Provided'}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      py: 2
                    }}
                  >
                    No vehicle selected
                  </Typography>
                )}
              </Stack>
            </CardContentStyled>
          </StyledCard>
        </Grid>

        {/* Customer Card */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardHeaderStyled
              avatar={<PersonIcon color="primary" />}
              title="Customer Information"
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View Customer Details (Hold Ctrl/Cmd to open in new tab)">
                    <NavButton
                      onClick={handleCustomerClick}
                      disabled={!order.customer?.id}
                      startIcon={<LaunchIcon />}
                      size="small"
                    >
                      View
                    </NavButton>
                  </Tooltip>
                  <Tooltip title="Change Customer">
                    <EditButton
                      onClick={() => openSearchDialog('customer')}
                      disabled={disabled}
                      size="small"
                    >
                      <SwapIcon />
                    </EditButton>
                  </Tooltip>
                </Stack>
              }
            />
            <CardContentStyled>
              <Stack spacing={2}>
                {order.customer ? (
                  <>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '1.1rem',
                        color: 'text.primary'
                      }}
                    >
                      {order.customer?.display_name}
                    </Typography>

                    <Stack spacing={1}>
                      <InfoChip
                        icon={<PhoneIcon />}
                        label={order.customer?.phone || 'Not Provided'}
                        sx={{ width: '100%' }}
                      />
                      <InfoChip
                        icon={<EmailIcon />}
                        label={order.customer?.email || 'Not Provided'}
                        sx={{ width: '100%' }}
                      />
                    </Stack>
                  </>
                ) : (
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      py: 2
                    }}
                  >
                    No customer selected
                  </Typography>
                )}
              </Stack>
            </CardContentStyled>
          </StyledCard>
        </Grid>

        {/* Status Card */}
        <Grid item xs={12}>
          <StyledCard>
            <CardHeaderStyled
              avatar={<BuildIcon color="primary" />}
              title="Service Order Status"
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  <StatusButton
                    onClick={handleStatusClick}
                    disabled={disabled}
                    endIcon={<ArrowDropDownIcon />}
                    sx={{ 
                      backgroundColor: alpha(getStatusColor(order.status), 0.1),
                      color: getStatusColor(order.status),
                      '&:hover': {
                        backgroundColor: alpha(getStatusColor(order.status), 0.15),
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'currentColor',
                          flexShrink: 0
                        }}
                      />
                      {formatStatus(order.status)}
                    </Box>
                  </StatusButton>
                  {order.target_date && (
                    <InfoChip
                      icon={<ScheduleIcon />}
                      label={`Target: ${new Date(order.target_date).toLocaleDateString()}`}
                    />
                  )}
                  {order.total && (
                    <InfoChip
                      icon={<MoneyIcon />}
                      label={`Total: $${order.total.toFixed(2)}`}
                    />
                  )}
                </Stack>
              }
            />
            <Menu
              anchorEl={statusMenuAnchor}
              open={Boolean(statusMenuAnchor)}
              onClose={handleStatusClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              {constants.order_statuses.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  selected={order.status === status}
                  sx={{
                    py: 1,
                    px: 2,
                    color: getStatusColor(status),
                    '&.Mui-selected': {
                      backgroundColor: alpha(getStatusColor(status), 0.1),
                      '&:hover': {
                        backgroundColor: alpha(getStatusColor(status), 0.15),
                      }
                    }
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(status)
                      }}
                    />
                    <Typography
                      sx={{
                        color: 'inherit',
                        fontWeight: order.status === status ? 600 : 400
                      }}
                    >
                      {formatStatus(status)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Menu>
          </StyledCard>
        </Grid>

        {/* Mechanic Card */}
        <Grid item xs={12}>
          <StyledCard>
            <CardHeaderStyled
              avatar={<BuildIcon color="primary" />}
              title="Assigned Mechanic"
              action={
                <StatusButton
                  onClick={handleMechanicMenuOpen}
                  disabled={disabled}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{ 
                    backgroundColor: alpha(getMechanicColor(order.mechanicId), 0.1),
                    color: getMechanicColor(order.mechanicId),
                    '&:hover': {
                      backgroundColor: alpha(getMechanicColor(order.mechanicId), 0.15),
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'currentColor',
                        flexShrink: 0
                      }}
                    />
                    {assignedMechanic ? assignedMechanic.name : 'Unassigned'}
                  </Box>
                </StatusButton>
              }
            />
            <Menu
              anchorEl={mechanicMenuAnchor}
              open={Boolean(mechanicMenuAnchor)}
              onClose={handleMechanicMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              <MenuItem
                onClick={() => handleMechanicChange(null)}
                selected={!order.mechanicId}
                sx={{
                  py: 1,
                  px: 2,
                  color: getMechanicColor(null),
                  '&.Mui-selected': {
                    backgroundColor: alpha(getMechanicColor(null), 0.1),
                    '&:hover': {
                      backgroundColor: alpha(getMechanicColor(null), 0.15),
                    }
                  }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getMechanicColor(null)
                    }}
                  />
                  <Typography
                    sx={{
                      color: 'inherit',
                      fontWeight: !order.mechanicId ? 600 : 400
                    }}
                  >
                    Unassigned
                  </Typography>
                </Stack>
              </MenuItem>
              {constants.mechanics.map((mechanic) => (
                <MenuItem
                  key={mechanic.id}
                  onClick={() => handleMechanicChange(mechanic.id)}
                  selected={order.mechanicId === mechanic.id}
                  sx={{
                    py: 1,
                    px: 2,
                    color: getMechanicColor(mechanic.id),
                    '&.Mui-selected': {
                      backgroundColor: alpha(getMechanicColor(mechanic.id), 0.1),
                      '&:hover': {
                        backgroundColor: alpha(getMechanicColor(mechanic.id), 0.15),
                      }
                    }
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getMechanicColor(mechanic.id)
                      }}
                    />
                    <Typography
                      sx={{
                        color: 'inherit',
                        fontWeight: order.mechanicId === mechanic.id ? 600 : 400
                      }}
                    >
                      {mechanic.name}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Menu>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Search Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: (theme) => theme.shadows[8]
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {searchType === 'car' ? 'Search Vehicle' : 'Search Customer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <SearchField
            fullWidth
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value, searchType);
            }}
            onKeyDown={handleKeyPress}
            placeholder={`Search for ${searchType === 'car' ? 'vehicle' : 'customer'}...`}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <ResultList>
            {searchResults.map((result, index) => (
              <ListItemButton
                key={index}
                selected={index === selectedIndex}
                onClick={() => result.action()}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  }
                }}
              >
                <ListItemAvatar>
                  {index === 0 ? (
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: 'success.main'
                      }}
                    >
                      <AddIcon />
                    </Avatar>
                  ) : searchType === 'car' ? (
                    <ResultAvatar
                      src={result.thumbnail}
                    >
                      <CarIcon />
                    </ResultAvatar>
                  ) : (
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: 'primary.main'
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText 
                  primary={result.label}
                  secondary={index === 0 ? 'Create new entry' : ''}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: index === selectedIndex ? 600 : 400
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary'
                  }}
                />
              </ListItemButton>
            ))}
          </ResultList>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const setCar = async (stockNumber, car) => {
  const db = firebase.firestore();
  const carData = {
    ...car,
    title: `${car.year || ''} ${car.make || ''} ${car.model || ''}`,
    id: car.objectID
  };
  
  const update = {
    car: carData,
    thumbnail: car.thumbnail || null
  };
  
  StateManager.updateCar(update);
  await db.doc('orders/'+stockNumber).set({
    car: car.objectID,
    thumbnail: car.thumbnail || null
  }, { merge: true });
};

const setCustomer = async (stockNumber, customer) => {
  const db = firebase.firestore();
  const customerData = {
    ...customer,
    display_name: `${customer.first_name || ''} ${customer.last_name || ''}`,
    id: customer.objectID
  };
  
  const update = { customer: customerData };
  StateManager.updateCar(update);
  
  await db.doc('orders/'+stockNumber).set({
    customer: customer.objectID
  }, { merge: true });
}; 