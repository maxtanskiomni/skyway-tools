import React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MuiAlert from '@mui/material/Alert';
import SimpleTable from '../../components/SimpleTable';
import firebase from '../../utilities/firebase';
import history from '../../utilities/history';
import { StateManager } from '../../utilities/stateManager';
import { MenuItem } from '@mui/material';
import PlaidLinkButton from '../../components/PlaidButton';

export default function Accounts(props) {
  const { data = {} } = props;
  const { accounts = [] } = data;

  const rows = accounts.map(account => {
    return {
      ...account,
      account_num: `*****${account.mask}`,
      current: account.balances.current,
      available: account.balances.available,
      // bank_selector: SelectBank(account),
      // rowLink: editCash(account),
      // rowLink: stock && `../car/${account}`,
    }
  })
  .filter(x => true);

  const tableData = {
    rows,
    headers: [
      {key:'name', label:'Account'}, 
      {key:'account_num', label:'Number'}, 
      {key:'current', label:'Current Balance', format:'usd'}, 
      {key:'available', label:'Available Balance', format:'usd'}, 
    ],
    title: '', 
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SimpleTable {...tableData}/>
      </Grid>
      
      <div style={{width: "100%", justifyContent: "center"}}>
        <PlaidLinkButton />
      </div>
    </Grid>
  );
}

const dismissCheck = async (id) => {
  StateManager.setLoading(true);
  await firebase.firestore().collection('checks').doc(id).update({status: 'cleared'});
  StateManager.updateData();
  StateManager.setLoading(false)
}

const deleteButton = (id) => (
  <Button variant="contained" color="primary" onClick={async (e) => {
    e.stopPropagation();
    dismissCheck(id)
    }}>
    Dismiss
  </Button>
);


const SelectBank = (check) => {
  const {id} = check;
  const [value, setValue] = React.useState(check.bank || "");

  const onChange = async (e) => {
    console.log(e.target)
    let { value } = e.target;
    setValue(`${value}` || "");
    await firebase.firestore().collection('checks').doc(id).update({bank: value});
  }

  return (
    <Select
      labelId={id}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
    >
      {StateManager.deposit_banks.map( selection => <MenuItem value={selection.value}>{selection.label}</MenuItem>)}
    </Select>
  )
}
