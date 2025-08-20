import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  Backdrop,
  Fade,
} from '@mui/material';
import {
  DateRange,
  CalendarToday,
  TrendingUp,
  Refresh,
  ChevronLeft,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';

const DateRangeSelector = ({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  title = "Performance Period",
  showQuickSelectors = true 
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [localStartDate, setLocalStartDate] = React.useState(startDate ? moment(startDate).toDate() : moment().startOf('month').toDate());
  const [localEndDate, setLocalEndDate] = React.useState(endDate ? moment(endDate).toDate() : moment().endOf('month').toDate());

  React.useEffect(() => {
    if (startDate) setLocalStartDate(moment(startDate).startOf('month').toDate());
    if (endDate) setLocalEndDate(moment(endDate).endOf('month').toDate());
  }, [startDate, endDate]);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setLocalStartDate(start);
    setLocalEndDate(end);
  };

  const handleApply = () => {
    if (localStartDate && localEndDate) {
      onDateRangeChange(localStartDate, localEndDate);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setLocalStartDate(startDate ? moment(startDate).toDate() : moment().startOf('month').toDate());
    setLocalEndDate(endDate ? moment(endDate).toDate() : moment().endOf('month').toDate());
    setIsModalOpen(false);
  };

  const quickSelectors = [
    {
      label: 'This Month',
      getDates: () => ({
        start: moment().startOf('month').toDate(),
        end: moment().endOf('month').toDate()
      })
    },
    {
      label: 'Last Month',
      getDates: () => ({
        start: moment().subtract(1, 'month').startOf('month').toDate(),
        end: moment().subtract(1, 'month').endOf('month').toDate()
      })
    },
    {
      label: 'Last 3 Months',
      getDates: () => ({
        start: moment().subtract(3, 'months').startOf('month').toDate(),
        end: moment().endOf('month').toDate()
      })
    },
    {
      label: 'Last 6 Months',
      getDates: () => ({
        start: moment().subtract(6, 'months').startOf('month').toDate(),
        end: moment().endOf('month').toDate()
      })
    },
    {
      label: 'This Year',
      getDates: () => ({
        start: moment().startOf('year').toDate(),
        end: moment().endOf('year').toDate()
      })
    },
    {
      label: 'Last Year',
      getDates: () => ({
        start: moment().subtract(1, 'year').startOf('year').toDate(),
        end: moment().subtract(1, 'year').endOf('year').toDate()
      })
    }
  ];

  const handleQuickSelect = (selector) => {
    const { start, end } = selector.getDates();
    setLocalStartDate(start);
    setLocalEndDate(end);
    onDateRangeChange(start, end);
  };

  const formatDateRange = () => {
    if (!localStartDate || !localEndDate) return 'Select Date Range';
    
    const start = moment(localStartDate).startOf('month');
    const end = moment(localEndDate).endOf('month');
    
    // Debug logging to help identify issues
    console.log('DateRangeSelector - Input dates:', { startDate, endDate });
    console.log('DateRangeSelector - Local dates:', { localStartDate, localEndDate });
    console.log('DateRangeSelector - Moment dates:', { 
      start: start.format('YYYY-MM-DD'), 
      end: end.format('YYYY-MM-DD') 
    });
    
    if (start.isSame(end, 'month') && start.isSame(end, 'year')) {
      return start.format('MMMM YYYY');
    } else if (start.isSame(end, 'year')) {
      return `${start.format('MMM')} - ${end.format('MMM, YYYY')}`;
    } else {
      return `${start.format('MMM, YYYY')} - ${end.format('MMM, YYYY')}`;
    }
  };

  const getDurationText = () => {
    if (!localStartDate || !localEndDate) return '';
    
    const start = moment(localStartDate);
    const end = moment(localEndDate);
    const months = end.diff(start, 'months', true);
    
    if (months < 1) return 'Less than 1 month';
    if (months === 1) return '1 month';
    if (months < 12) return `${Math.round(months)} months`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper 
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)'
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">
                {title}
              </Typography>
            </Box>
            <Tooltip title="Refresh to current month">
              <IconButton 
                onClick={() => handleQuickSelect(quickSelectors[0])}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<DateRange />}
              onClick={() => setIsModalOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)'
                },
                borderRadius: 2,
                px: 3,
                py: 1.5
              }}
            >
              {formatDateRange()}
            </Button>
            
            <Chip
              label={getDurationText()}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 500
              }}
            />
          </Box>

          {showQuickSelectors && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {quickSelectors.map((selector, index) => (
                <Chip
                  key={index}
                  label={selector.label}
                  onClick={() => handleQuickSelect(selector)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    },
                    fontSize: '0.8rem'
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Modal for Date Picker */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Fade in={isModalOpen}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Select Date Range
              </Typography>
              <IconButton 
                onClick={() => setIsModalOpen(false)}
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <DatePicker
                selected={localStartDate}
                onChange={handleDateChange}
                startDate={localStartDate}
                endDate={localEndDate}
                selectsRange
                inline
                showMonthYearPicker
                dateFormat="MMM yyyy"
                minDate={moment().subtract(5, 'years').toDate()}
                maxDate={moment().add(1, 'year').toDate()}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                fullWidth
                size="large"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleApply}
                fullWidth
                size="large"
                disabled={!localStartDate || !localEndDate}
                sx={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)'
                  }
                }}
              >
                Apply Range
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Modal>

      <style>
        {`
          .react-datepicker {
            font-family: 'Roboto', sans-serif;
            border: none;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            overflow: hidden;
          }
          .react-datepicker__header {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            border: none;
            padding: 16px;
          }
          .react-datepicker__current-month {
            color: white;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .react-datepicker__day--selected {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%) !important;
            border-radius: 50% !important;
            color: white !important;
            font-weight: bold;
          }
          .react-datepicker__day--in-range {
            background: rgba(33, 150, 243, 0.15) !important;
            color: #2196F3 !important;
            border-radius: 0 !important;
          }
          .react-datepicker__day--keyboard-selected {
            background: rgba(33, 150, 243, 0.25) !important;
            color: #2196F3 !important;
          }
          .react-datepicker__day:hover {
            background: rgba(33, 150, 243, 0.1) !important;
            border-radius: 50% !important;
            color: #2196F3 !important;
          }
          .react-datepicker__day {
            border-radius: 50%;
            margin: 2px;
            width: 32px;
            height: 32px;
            line-height: 32px;
            font-size: 14px;
          }
          .react-datepicker__navigation {
            color: white !important;
            border: none !important;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            top: 16px;
          }
          .react-datepicker__navigation:hover {
            background: rgba(255,255,255,0.2) !important;
            border-radius: 50%;
          }
          .react-datepicker__navigation--previous {
            left: 16px;
          }
          .react-datepicker__navigation--next {
            right: 16px;
          }
          .react-datepicker__month-container {
            padding: 8px;
          }
          .react-datepicker__day-name {
            color: #666;
            font-weight: 600;
            font-size: 12px;
            margin: 4px;
            width: 32px;
            height: 32px;
            line-height: 32px;
          }
        `}
      </style>
    </Box>
  );
};

export default DateRangeSelector; 