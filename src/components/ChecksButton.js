import React from 'react';
import Button from '@mui/material/Button';
import { StateManager } from '../utilities/stateManager';
import RequestManager from '../utilities/requestManager';


export default function TrackingButton(props) {
  const {cta = "Print Checks", generator = () => null} = props;
  const [printDisabled, setPrint] = React.useState(false);
  StateManager.setPrint = setPrint;

  const printChecks = async () => {
    StateManager.setAlertAndOpen("Making check..", "info");
    StateManager.setLoading(true);

    // [{amount, payee, memo, date, id}]
    const checkRequests = props.generator();
    console.log(checkRequests)
    let writeResponse = {success: false};
    if(checkRequests.length > 0){
      const writeParams = {function: "writeChecks", variables: {checkRequests}};
      writeResponse = await RequestManager.post(writeParams);
    }

  
    if(writeResponse.success) {
      props.callback && props.callback();
      StateManager.setAlertAndOpen("Check created!", "success");
    }
    else StateManager.setAlertAndOpen("Check not created", "error");
  
    StateManager.setLoading(false);
  }

  return (
    <>
      {
        StateManager.isUserAllowed("checks") && (
          <div style={{width: "100%", justifyContent: "center"}}>
            <Button disabled={printDisabled} variant="contained" color="primary" style={{marginTop: '20px'}} onClick={printChecks}>
              {cta}
            </Button>
          </div>
        )
      }
    </>
  )
}
