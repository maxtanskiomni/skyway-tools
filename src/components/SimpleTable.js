import React, { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import moment from 'moment';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function SimpleTable(props) {
  const { title = '', headers = [], rows = [] } = props;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedRows = React.useMemo(() => {
    if (sortConfig.key) {
      return [...rows].sort((a, b) => {
        const header = headers.find(h => h.key === sortConfig.key);
        const isDate = header?.format === 'date';

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Extract value if the column has a TextField or Select component
        if (React.isValidElement(aValue) && React.isValidElement(bValue)) {
          if (aValue.props?.value !== undefined) aValue = aValue.props.value;
          if (bValue.props?.value !== undefined) bValue = bValue.props.value;
          console.log(aValue)
        }

        if (isDate) {
          aValue = moment(aValue).toDate();
          bValue = moment(bValue).toDate();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [rows, sortConfig, headers]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const classes = useStyles();

  const setAlignment = (length, position) => {
    let alignment = position === length - 1 ? 'right' : 'left';
    if (props.forceAlignment) alignment = props.forceAlignment;
    return alignment;
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
    }
    return null;
  };

  return (
    <React.Fragment>
      <Paper className={classes.paper}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((header, i) => (
                <TableCell
                  key={header.key}
                  align={setAlignment(headers.length, i)}
                  onClick={() => handleSort(header.key)}
                  className={classes.clickableHeader}
                >
                  <b>{header.label}</b> {renderSortIndicator(header.key)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, number) => (
              <TableRow
                key={row.id}
                onClick={row.rowAction}
                style={{ cursor: row.rowAction ? 'pointer' : 'default' }}
              >
                {headers.map((header, i) => (
                  <TableCell key={header.key} align={setAlignment(headers.length, i)}>
                    {props.disabled ? (
                      <span style={{ color: 'inherit', textDecoration: 'inherit' }}>
                        {header.key === 'number' ? number + 1 : formatValue(header.format, row[header.key])}
                      </span>
                    ) : (
                      <a
                        style={{ color: 'inherit', textDecoration: 'inherit' }}
                        target={props.linkLocation || '_self'}
                        href={header.noLink ? undefined : row[`${header.key}Link`] || row.rowLink}
                      >
                        {header.key === 'number' ? number + 1 : formatValue(header.format, row[header.key])}
                      </a>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {props.summary && (
        <Paper className={classes.paper}>
          <Table size="small">
            <TableBody>
              {props.summary.map &&
                props.summary.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell style={{ fontWeight: 'bold' }}>{row.label}</TableCell>
                    <TableCell style={{ fontSize: 18, fontWeight: '800' }} align={'right'}>
                      {formatValue(row.format, row.value)}
                    </TableCell>
                  </TableRow>
                ))}
              {!props.summary.map && (
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold' }}>{props.summary.label}</TableCell>
                  <TableCell style={{ fontSize: 18, fontWeight: '800' }} align={'right'}>
                    {formatValue(props.summary.format, props.summary.value)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </React.Fragment>
  );
}

function formatValue(type = null, value) {
  if (type === 'usd') return `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === 'date') {
    let date = moment(value);
    date = (value && date.isValid()) ? date.format('MM/DD/YY') : '';
    return date;
  }
  return value;
}

const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  clickableHeader: {
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));