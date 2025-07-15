import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  alpha,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import moment from 'moment';
import firebase from '../../utilities/firebase';
import { StateManager } from '../../utilities/stateManager';
import constants from '../../utilities/constants';
import PartEditForm from './PartEditForm';

const PartsDashboardPage = () => {
  StateManager.setTitle("Parts Dashboard");
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const [parts, setParts] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    statusCounts: {}
  });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPartId, setUpdatingPartId] = useState(null);
  const [selectedPartForEdit, setSelectedPartForEdit] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get initial status from URL or default to first status
  const getInitialStatus = () => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    const validStatuses = constants.part_statuses.filter(status => status !== 'complete');
    return validStatuses.includes(statusParam) ? statusParam : validStatuses[0];
  };

  const [statusFilter, setStatusFilter] = useState(getInitialStatus());

  // Update URL when status changes
  const updateStatusFilter = (newStatus) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('status', newStatus);
    history.replace({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    setStatusFilter(newStatus);
  };

  // Fetch all parts once on component mount
  const fetchAllParts = async () => {
    try {
      setLoading(true);
      const snapshot = await firebase.firestore()
        .collection('parts')
        .where('status', 'in', constants.part_statuses.filter(status => status !== 'complete'))
        .get();
      
      if (snapshot.empty) {
        setAllParts([]);
        return;
      }

      const parts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch order and car details for each part
      const partsWithDetails = await Promise.all(parts.map(async (part) => {
        const [orderData, carData] = await Promise.all([
          // Fetch order data
          (async () => {
            if (!part.order) return null;
            const orderSnapshot = await firebase.firestore()
              .collection('orders')
              .doc(part.order)
              .get();

            if (!orderSnapshot.exists) return null;
            const order = orderSnapshot.data();
            return {
              order_id: order.id,
              order_status: order.status
            };
          })(),
          // Fetch car data
          (async () => {
            if (!part.order) return null;
            const orderSnapshot = await firebase.firestore()
              .collection('orders')
              .doc(part.order)
              .get();

            if (!orderSnapshot.exists || !orderSnapshot.data().car) return null;
            const carSnapshot = await firebase.firestore()
              .collection('cars')
              .doc(orderSnapshot.data().car)
              .get();

            if (!carSnapshot.exists) return null;
            const car = carSnapshot.data();
            return {
              car_title: `${car.stock} - ${car.year} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ''}`,
              car_thumbnail: car.thumbnail
            };
          })()
        ]);

        return {
          ...part,
          ...(orderData || {}),
          ...(carData || {})
        };
      }));
      
      setAllParts(partsWithDetails);
      setMetrics({ statusCounts: calculateStatusCounts(partsWithDetails) });
    } catch (error) {
      console.error('Error fetching parts:', error);
      StateManager.setAlertAndOpen("Error fetching parts", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts from parts
  const calculateStatusCounts = (parts) => {
    const statusCounts = {};
    constants.part_statuses
      .filter(status => status !== 'complete')
      .forEach(status => {
        statusCounts[status] = parts.filter(part => part.status === status).length;
      });
    return statusCounts;
  };

  // Filter parts based on status and search query
  useEffect(() => {
    if (!allParts.length) return;

    const searchLower = searchQuery.toLowerCase();
    const filteredParts = allParts.filter(part => {
      const matchesStatus = part.status === statusFilter;
      const matchesSearch = 
        part.id?.toLowerCase().includes(searchLower) ||
        part.name?.toLowerCase().includes(searchLower) ||
        part.vendor?.toLowerCase().includes(searchLower) ||
        part.car_title?.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesSearch;
    });

    setParts(filteredParts);
  }, [allParts, statusFilter, searchQuery]);

  // Update status filter when URL changes
  useEffect(() => {
    const newStatus = getInitialStatus();
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  }, [location.search]);

  // Fetch all parts on mount
  useEffect(() => {
    fetchAllParts();
  }, []); // Only fetch on initial mount

  const handlePartClick = (event, partId) => {
    if (event.metaKey || event.ctrlKey) {
      window.open(`/part/${partId}`, '_blank');
      return;
    }
    const part = allParts.find(p => p.id === partId);
    if (part) {
      setSelectedPartForEdit(part);
      setEditDialogOpen(true);
    }
  };

  const handleStatusClick = (event, part) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setSelectedPart(part);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedPart(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedPart) return;

    setUpdatingStatus(true);
    setUpdatingPartId(selectedPart.id);

    try {
      // Update the local state first for immediate feedback
      setAllParts(prevParts => 
        prevParts.map(part => 
          part.id === selectedPart.id 
            ? { ...part, status: newStatus }
            : part
        )
      );

      // Then update the database
      await firebase.firestore()
        .collection('parts')
        .doc(selectedPart.id)
        .update({
          status: newStatus,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      
      StateManager.setAlertAndOpen("Status updated successfully", "success");
    } catch (error) {
      // Revert the local state if the update fails
      setAllParts(prevParts => 
        prevParts.map(part => 
          part.id === selectedPart.id 
            ? { ...part, status: selectedPart.status }
            : part
        )
      );
      console.error('Error updating status:', error);
      StateManager.setAlertAndOpen("Error updating status", "error");
    } finally {
      setUpdatingStatus(false);
      setUpdatingPartId(null);
      handleStatusMenuClose();
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedPartForEdit(null);
  };

  const handlePartUpdate = async (updates) => {
    if (!selectedPartForEdit) return;

    try {
      await firebase.firestore()
        .collection('parts')
        .doc(selectedPartForEdit.id)
        .update({
          ...updates,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      // Update local state
      setAllParts(prevParts => 
        prevParts.map(part => 
          part.id === selectedPartForEdit.id 
            ? { ...part, ...updates }
            : part
        )
      );

      StateManager.setAlertAndOpen("Part updated successfully", "success");
    } catch (error) {
      console.error('Error updating part:', error);
      StateManager.setAlertAndOpen("Error updating part", "error");
    }
  };

  const handlePartDelete = async () => {
    if (!selectedPartForEdit) return;

    if (!window.confirm("Are you sure you want to delete this part?")) {
      return;
    }

    try {
      await firebase.firestore()
        .collection('parts')
        .doc(selectedPartForEdit.id)
        .delete();

      // Remove from local state
      setAllParts(prevParts => 
        prevParts.filter(part => part.id !== selectedPartForEdit.id)
      );

      // Close the dialog
      handleEditDialogClose();
      
      StateManager.setAlertAndOpen("Part deleted successfully", "success");
    } catch (error) {
      console.error('Error deleting part:', error);
      StateManager.setAlertAndOpen("Error deleting part", "error");
    }
  };

  const handlePartSubmit = () => {
    // Close the dialog after successful save
    handleEditDialogClose();
  };

  const renderStatusCell = (part) => (
    <Box
      onClick={(e) => handleStatusClick(e, part)}
      className="status-cell"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: alpha(getStatusColor(part.status), 0.1),
        color: getStatusColor(part.status),
        fontWeight: 'medium',
        textTransform: 'capitalize',
        cursor: 'pointer',
        minWidth: 100,
        position: 'relative',
        '&:hover': {
          bgcolor: alpha(getStatusColor(part.status), 0.2),
        }
      }}
    >
      {updatingStatus && updatingPartId === part.id ? (
        <CircularProgress
          size={16}
          sx={{
            color: 'inherit',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      ) : (
        <>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'currentColor',
              flexShrink: 0
            }}
          />
          <Typography sx={{ opacity: updatingStatus && updatingPartId === part.id ? 0 : 1 }}>
            {part.status}
          </Typography>
        </>
      )}
    </Box>
  );

  const MetricCard = ({ status, count, color, onClick }) => (
    <Paper
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: alpha(color, 0.2),
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography component="h2" variant="subtitle2" color="text.secondary">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Typography>
        <Typography component="p" variant="h6">
          {count}
        </Typography>
      </Box>
    </Paper>
  );

  const getStatusColor = (status) => {
    const statusIndex = constants.part_statuses.indexOf(status);
    if (statusIndex === -1) return theme.palette.grey[500];

    const totalStatuses = constants.part_statuses.length;
    const progress = statusIndex / (totalStatuses - 1);

    if (progress < 0.25) {
      return theme.palette.info.light;
    } else if (progress < 0.5) {
      return theme.palette.info.main;
    } else if (progress < 0.75) {
      return theme.palette.primary.main;
    } else {
      return theme.palette.success.main;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {constants.part_statuses
              .filter(status => status !== 'complete')
              .map((status) => (
                <Box key={status} sx={{ flex: 1 }}>
                  <MetricCard
                    status={status}
                    count={metrics.statusCounts[status] || 0}
                    color={getStatusColor(status)}
                    onClick={() => updateStatusFilter(status)}
                  />
                </Box>
              ))}
          </Box>
        </Grid>

        {/* Search and Filter Bar */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => updateStatusFilter(e.target.value)}
              >
                {constants.part_statuses
                  .filter(status => status !== 'complete')
                  .map((status) => (
                    <MenuItem 
                      key={status} 
                      value={status}
                      sx={{
                        color: getStatusColor(status),
                        '&.Mui-selected': {
                          backgroundColor: alpha(getStatusColor(status), 0.1),
                          '&:hover': {
                            backgroundColor: alpha(getStatusColor(status), 0.2),
                          },
                        },
                      }}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Parts Table */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Car</TableCell>
                    <TableCell>Part Name</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Est. Arrival</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : parts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No parts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((part) => (
                      <TableRow
                        key={part.id}
                        hover
                        onClick={(e) => handlePartClick(e, part.id)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            '& .status-cell': {
                              bgcolor: alpha(getStatusColor(part.status), 0.2),
                            }
                          }
                        }}
                      >
                        <TableCell>
                          {part.date
                            ? moment(part.date).format('MM/DD/YYYY')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {part.car_thumbnail ? (
                              <Box
                                component="img"
                                src={part.car_thumbnail}
                                alt={part.car_title}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(theme.palette.grey[300], 0.5),
                                  borderRadius: 1,
                                  color: theme.palette.grey[500],
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                }}
                              >
                                <DirectionsCarIcon sx={{ fontSize: 32 }} />
                              </Box>
                            )}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.95rem',
                                lineHeight: 1.2
                              }}
                            >
                              {part.car_title || '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell>{part.vendor}</TableCell>
                        <TableCell>
                          {renderStatusCell(part)}
                        </TableCell>
                        <TableCell>
                          {part.orderDate
                            ? moment(part.orderDate).format('MM/DD/YYYY')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {part.arrivalDate
                            ? moment(part.arrivalDate).format('MM/DD/YYYY')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              fontWeight: 'medium',
                              color: theme.palette.primary.main
                            }}
                          >
                            ${part.cost || 0}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor) && !updatingStatus}
        onClose={handleStatusMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
          }
        }}
      >
        {constants.part_statuses
          .filter(status => status !== 'complete' && status !== selectedPart?.status)
          .map((status) => (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={updatingStatus}
              sx={{
                color: getStatusColor(status),
                '&:hover': {
                  bgcolor: alpha(getStatusColor(status), 0.1),
                },
                '&.Mui-disabled': {
                  opacity: 0.7
                }
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(status)
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </ListItemText>
            </MenuItem>
          ))}
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedPartForEdit && (
            <PartEditForm
              part={selectedPartForEdit}
              onUpdate={handlePartUpdate}
              onDelete={handlePartDelete}
              onSubmit={handlePartSubmit}
              onCancel={handleEditDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PartsDashboardPage; 