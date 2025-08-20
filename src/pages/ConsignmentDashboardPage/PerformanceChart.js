import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import moment from 'moment';

// Simple chart component using CSS and divs for performance visualization
const PerformanceChart = ({ data, startDate, endDate }) => {
  const theme = useTheme();
  
  // Group data by date
  const groupedData = {};
  const current = moment(startDate);
  const end = moment(endDate);
  
  // Initialize all dates in range
  while (current.isSameOrBefore(end)) {
    const dateKey = current.format('YYYY-MM-DD');
    groupedData[dateKey] = { consigned: 0, sold: 0 };
    current.add(1, 'day');
  }
  
  // Populate with actual data
  data.forEach(item => {
    const dateKey = moment(item.date).format('YYYY-MM-DD');
    if (groupedData[dateKey]) {
      if (item.type === 'consigned') {
        groupedData[dateKey].consigned++;
      } else if (item.type === 'sold') {
        groupedData[dateKey].sold++;
      }
    }
  });
  
  const dates = Object.keys(groupedData).sort();
  
  // Calculate optimal number of buckets based on date range
  const daysDiff = moment(endDate).diff(moment(startDate), 'days');
  const maxBuckets = 20; // Maximum number of buckets to prevent overcrowding
  const minBuckets = 5;  // Minimum number of buckets for readability
  
  let bucketSize;
  let displayData = [];
  let bucketedData = {};
  
  if (daysDiff <= 7) {
    // Show daily data for 1 week or less
    bucketSize = 1;
    displayData = dates;
    bucketedData = groupedData;
  } else if (daysDiff <= 30) {
    // Show daily data but limit buckets
    bucketSize = Math.max(1, Math.ceil(daysDiff / maxBuckets));
    displayData = dates.filter((_, index) => index % bucketSize === 0);
    displayData.forEach(date => {
      bucketedData[date] = groupedData[date] || { consigned: 0, sold: 0 };
    });
  } else if (daysDiff <= 90) {
    // Show weekly data - aggregate all data within each week
    const weeks = {};
    dates.forEach(date => {
      const weekKey = moment(date).startOf('week').format('YYYY-MM-DD');
      if (!weeks[weekKey]) {
        weeks[weekKey] = { consigned: 0, sold: 0 };
      }
      weeks[weekKey].consigned += groupedData[date].consigned;
      weeks[weekKey].sold += groupedData[date].sold;
    });
    
    const weekKeys = Object.keys(weeks).sort();
    bucketSize = Math.max(1, Math.ceil(weekKeys.length / maxBuckets));
    displayData = weekKeys.filter((_, index) => index % bucketSize === 0);
    displayData.forEach(weekKey => {
      bucketedData[weekKey] = weeks[weekKey];
    });
  } else if (daysDiff <= 365) {
    // Show monthly data - aggregate all data within each month
    const months = {};
    dates.forEach(date => {
      const monthKey = moment(date).startOf('month').format('YYYY-MM');
      if (!months[monthKey]) {
        months[monthKey] = { consigned: 0, sold: 0 };
      }
      months[monthKey].consigned += groupedData[date].consigned;
      months[monthKey].sold += groupedData[date].sold;
    });
    
    const monthKeys = Object.keys(months).sort();
    bucketSize = Math.max(1, Math.ceil(monthKeys.length / maxBuckets));
    displayData = monthKeys.filter((_, index) => index % bucketSize === 0);
    displayData.forEach(monthKey => {
      bucketedData[monthKey] = months[monthKey];
    });
  } else {
    // Show quarterly data for longer periods - aggregate all data within each quarter
    const quarters = {};
    dates.forEach(date => {
      const quarterKey = moment(date).quarter();
      const yearKey = moment(date).year();
      const quarterYearKey = `${yearKey}-Q${quarterKey}`;
      if (!quarters[quarterYearKey]) {
        quarters[quarterYearKey] = { consigned: 0, sold: 0 };
      }
      quarters[quarterYearKey].consigned += groupedData[date].consigned;
      quarters[quarterYearKey].sold += groupedData[date].sold;
    });
    
    const quarterKeys = Object.keys(quarters).sort();
    bucketSize = Math.max(1, Math.ceil(quarterKeys.length / maxBuckets));
    displayData = quarterKeys.filter((_, index) => index % bucketSize === 0);
    displayData.forEach(quarterKey => {
      bucketedData[quarterKey] = quarters[quarterKey];
    });
  }
  
  // Ensure we have at least minBuckets
  if (displayData.length < minBuckets && displayData.length > 0) {
    const originalData = [...displayData];
    displayData = [];
    const step = Math.max(1, Math.floor(originalData.length / minBuckets));
    for (let i = 0; i < originalData.length; i += step) {
      displayData.push(originalData[i]);
    }
    // Always include the last item
    if (displayData[displayData.length - 1] !== originalData[originalData.length - 1]) {
      displayData.push(originalData[originalData.length - 1]);
    }
  }
  
  // Calculate maxValue from bucketed data instead of original groupedData
  const maxValue = Math.max(...Object.values(bucketedData).map(d => Math.max(d.consigned, d.sold)));
  
  // Generate intelligent Y-axis tick marks
  const generateYTicks = (maxVal) => {
    if (maxVal === 0) return [0];
    
    // Calculate appropriate number of ticks (3-6 ticks)
    const tickCount = Math.min(6, Math.max(3, Math.ceil(maxVal / 2)));
    
    // Round up to nearest nice number
    const niceMax = Math.ceil(maxVal * 1.1); // Add 10% padding
    const niceStep = Math.ceil(niceMax / tickCount);
    
    // Generate ticks
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = i * niceStep;
      if (tickValue <= niceMax) {
        ticks.push(tickValue);
      }
    }
    
    return ticks;
  };
  
  const yTicks = generateYTicks(maxValue);
  const chartMaxValue = Math.max(...yTicks);
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Performance Over Time
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'stretch', height: 200, mt: 2 }}>
        {/* Y-axis */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          mr: 1, 
          minWidth: 40,
          position: 'relative'
        }}>
          {yTicks.slice().reverse().map((tick) => (
            <Box key={tick} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              height: 20,
              position: 'relative'
            }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                position: 'absolute',
                right: 0
              }}>
                {tick}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Chart area */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          flex: 1, 
          gap: 1,
          position: 'relative'
        }}>
          {/* Chart bars */}
          {displayData.map((dateKey, index) => {
            const data = bucketedData[dateKey] || { consigned: 0, sold: 0 };
            
            const consignedHeight = chartMaxValue > 0 ? (data.consigned / chartMaxValue) * 100 : 0;
            const soldHeight = chartMaxValue > 0 ? (data.sold / chartMaxValue) * 100 : 0;

            console.log('Debug - consignedHeight:', consignedHeight);
            console.log('Debug - soldHeight:', soldHeight);
            
            // Format label based on the data type
            let label;
            if (daysDiff <= 7) {
              label = moment(dateKey).format('MM/DD');
            } else if (daysDiff <= 90) {
              label = moment(dateKey).format('MM/DD');
            } else if (daysDiff <= 365) {
              label = moment(dateKey).format('MMM YYYY');
            } else {
              label = dateKey; // Quarter format like "2023-Q1"
            }
            
            return (
              <Box key={dateKey} sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                height: '100%',
                zIndex: 1
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  height: '100%', 
                  justifyContent: 'flex-end', 
                  gap: 1,
                  alignItems: 'flex-end'
                }}>
                  <Box
                    sx={{
                      height: `${consignedHeight}%`,
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: alpha(theme.palette.primary.main, 0.7),
                      minHeight: data.consigned > 0 ? 4 : 0,
                      borderRadius: 1,
                      width: '45%'
                    }}
                  />
                  <Box
                    sx={{
                      height: `${soldHeight}%`,
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: alpha(theme.palette.success.main, 0.7),
                      minHeight: data.sold > 0 ? 4 : 0,
                      borderRadius: 1,
                      width: '45%'
                    }}
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    maxWidth: '100%'
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, backgroundColor: theme.palette.primary.main, borderRadius: 1 }} />
          <Typography variant="caption">Consigned</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, backgroundColor: theme.palette.success.main, borderRadius: 1 }} />
          <Typography variant="caption">Sold</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default PerformanceChart; 