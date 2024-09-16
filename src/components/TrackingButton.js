import React from 'react';
import IconButton from '@mui/material/IconButton';
import { Add } from '@mui/icons-material';
import history from '../utilities/history';


export default function TrackingButton(props) {
  const { id, expand = "" } = props;
  const url = new URL(window.location.href)
  const redirect = url.pathname
  const trackingURL = `/form/add-tracking?redirect=${redirect}&tab=repairs&expand=${expand}&p=`;
  const addTracking = (id) => history.push(trackingURL + id);

  return (
    <IconButton
      aria-label="add-link"
      color="primary"
      onClick={() => addTracking(id)}
      size="large">
      <Add />
    </IconButton>
  );
}
