import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import {
  Person as PersonIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import constants from '../../utilities/constants';

const ConsignorLeaderboard = ({ vehicles, loading }) => {
  // Calculate consignor statistics
  const getConsignorStats = () => {
    const consignorMap = {};
    
    // Initialize all employee consignors with zero counts
    constants.consignors.forEach(consignorName => {
      consignorMap[consignorName] = {
        name: consignorName,
        totalConsigned: 0,
        sold: 0,
        active: 0,
        totalValue: 0
      };
    });
    
    // Count vehicles for each employee consignor
    vehicles.forEach(vehicle => {
      const consignorRep = vehicle.consign_rep; // This is the employee assigned to the consignment
      
      if (consignorRep && consignorMap[consignorRep]) {
        consignorMap[consignorRep].totalConsigned += 1;
        consignorMap[consignorRep].totalValue += vehicle.price || 0;
        
        if (vehicle.status === 'sold') {
          consignorMap[consignorRep].sold += 1;
        } else {
          consignorMap[consignorRep].active += 1;
        }
      }
    });
    
    // Convert to array, filter out those with zero consignments, and sort by total consigned (descending)
    return Object.values(consignorMap)
      .filter(consignor => consignor.totalConsigned > 0)
      .sort((a, b) => b.totalConsigned - a.totalConsigned);
  };

  const consignorStats = getConsignorStats();

  // Loading skeleton
  const LeaderboardSkeleton = () => (
    <Paper sx={{ p: 3, height: 400 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
      {Array.from({ length: 5 }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="text" width={60} height={20} />
        </Box>
      ))}
    </Paper>
  );

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <Box sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      
      {consignorStats.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No consignors found for the selected period
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <List sx={{ p: 0, height: '100%', overflow: 'auto' }}>
            {consignorStats.map((consignor, index) => (
              <ListItem
                key={consignor.name}
                sx={{
                  borderBottom: index < consignorStats.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  py: 1.5
                }}
              >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: index === 0 ? 'gold' : 
                           index === 1 ? 'silver' : 
                           index === 2 ? '#ca9f6b' : 'primary.main',
                    width: 40,
                    height: 40
                  }}
                >
                  {index < 3 ? (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {index + 1}
                    </Typography>
                  ) : (
                    <PersonIcon />
                  )}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                                 primary={
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Typography variant="body1" sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                       {consignor.name}
                     </Typography>
                     {index < 3 && (
                       <Chip
                         label={index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                         size="small"
                         sx={{ 
                          height: 20, 
                          fontSize: '0.75rem',
                          backgroundColor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#ca9f6b'
                        }}
                       />
                     )}
                   </Box>
                 }
                secondary={
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {consignor.totalConsigned} total
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {consignor.sold} sold
                    </Typography>
                    <Typography variant="body2" color="info.main">
                      {consignor.active} active
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${consignor.totalValue.toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                  {consignor.totalConsigned}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vehicles
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
        </Box>
      )}
    </Box>
  );
};

export default ConsignorLeaderboard; 