import React from 'react';
import IconButton from '@mui/material/IconButton';
import { Add } from '@mui/icons-material';
import history from '../utilities/history';


export default function NewNoteButton(props) {
  const { ref_value } = props;
  
  const onClick = (e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    const redirect = url.pathname;
    const tab = url.searchParams.get("tab");
    const expand = url.searchParams.get("expand");
    history.push(`/form/new-note?redirect=${redirect}&tab=${tab}&expand=${expand}&ref_value=${ref_value}`)
  };

  return (
    <IconButton
      aria-label="add-link"
      color={props.color || "primary"}
      onClick={onClick}
      size="large">
      <Add />
    </IconButton>
  );
}
