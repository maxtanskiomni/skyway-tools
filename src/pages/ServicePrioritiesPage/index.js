import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, List, ListItem, ListItemText, Divider, CircularProgress, Grid, Box, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import RequestManager from '../../utilities/requestManager'; // Importing RequestManager for API call

const PrioritiesPage = () => {
  const [priorities, setPriorities] = useState([]);
  const [filteredPriorities, setFilteredPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    title: '',
    type: ''
  });

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const response = await RequestManager.get({
          function: 'getServicePriorities',
        });

        if (response && response.success) {
          setPriorities(response.data); // Assuming 'response.data' holds the array of priorities
          setFilteredPriorities(response.data); // Initially show all priorities
        } else {
          console.error('Error fetching priorities:', response);
        }
      } catch (error) {
        console.error('API error fetching priorities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, []);

  // Filter handler
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters whenever filter state changes
  useEffect(() => {
    const filtered = priorities.filter(priority => {
      return (
        (filters.title === '' || `${priority.stock} ${priority.title}`.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.type === '' || priority.type === filters.type)
      );
    });
    setFilteredPriorities(filtered);
  }, [filters, priorities]);

  return (
    <Container sx={{ marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h4" gutterBottom>
          Service Order Priorities
        </Typography>
        <Typography variant="h6" gutterBottom>
          {filteredPriorities.length} items | ${filteredPriorities.reduce((a,c) => a+c.score, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} potential cashflow
        </Typography>

        {/* Filter Section */}
        <Grid container spacing={2} sx={{ marginBottom: 3 }}>
          <Grid item xs={6}>
            <TextField
              label="Search cars" // Changed from "Title"
              name="title"
              value={filters.title}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="repair">Not Online</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {/* Table Headers */}
            <Grid container>
              <Grid item xs={8} textAlign="left" fontWeight="fontWeightBold">
                <Typography variant="h6" gutterBottom sx={{textDecoration: 'underline'}}>Car Information</Typography> {/* Added Car Info header */}
              </Grid>
              <Grid item xs={4} textAlign="right" fontWeight="fontWeightBold">
                <Typography variant="h6" gutterBottom sx={{textDecoration: 'underline'}}>Potential Cashflow</Typography> {/* Added Financial Impact header */}
              </Grid>
            </Grid>

            <List>
              {filteredPriorities.length === 0 ? (
                <Typography variant="body1">No priorities to display.</Typography>
              ) : (
                filteredPriorities.map((priority) => (
                  <React.Fragment key={priority.id}>
                    <ListItem>
                      <Grid container alignItems="center">
                        {/* Thumbnail image if it exists or placeholder if it doesn't */}
                        <Grid item xs={2}>
                          <a target="_blank" href={`/car/${priority.stock}`}>
                            <Box
                              component="img"
                              src={priority.thumbnail || 'https://www.shutterstock.com/image-vector/car-logo-icon-emblem-design-600nw-473088025.jpg'}  // Placeholder image URL
                              alt={priority.title}
                              sx={{ width: '100px', height: '100px', objectFit: 'contain' }}
                            />
                          </a>
                        </Grid>

                        {/* Priority details */}
                        <Grid item xs={6}>
                          <ListItemText
                            primary={`${priority.stock} ${priority.title}`}
                            secondary={
                              <>
                                {/* <Typography component="span">
                                  Type: {priority.type} | Car Status: {priority.status}
                                </Typography> */}
                                <Typography component="span" display="block">
                                  Active SO: {priority.service_data.active_so || "None"}
                                </Typography>
                                <Typography component="span" display="block">
                                  Parts Pending: {priority.service_data.parts_pending}
                                </Typography>
                                <Typography component="span" display="block">
                                  Parts Inbound: {priority.service_data.parts_inbound}
                                </Typography>
                                <Typography component="span" display="block">
                                  Incomplete Services: {priority.service_data.services_outstanding}
                                </Typography>
                              </>
                            }
                          />
                        </Grid>

                        {/* Expected value on the far right, with bold styling */}
                        <Grid item xs={4} textAlign="right">
                          <Typography variant="body2" fontWeight="bold">
                            ${priority.score.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PrioritiesPage;
