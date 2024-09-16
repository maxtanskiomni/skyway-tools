import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import RequestManager from '../utilities/requestManager';
import { Button } from '@mui/material';
import { StateManager } from '../utilities/stateManager';

const PlaidLinkButton = () => {
  const [token, setToken] = useState(null);

  // Fetch the link_token from your server (see step 4)
  useEffect(() => {
    const fetchToken = async () => {
        const params = {
            function: "createLinkToken",
            variables: { userID: "skyway-classics" }
        }
        const response = await RequestManager.post(params);
        console.log(response)
        setToken(response.link_token);
    };

    fetchToken();
  }, []);

  const onSuccess = useCallback((publicToken, metadata) => {
    // Send the publicToken to your server to exchange it for an access token
    StateManager.setAlertAndOpen("Connecting account", "info");
    const params = {
      function: "exchangePublicToken",
      variables: { userID: "skyway-classics", publicToken  }
    }
    RequestManager.post(params).then(response => {
      if(response.success){
        StateManager.setAlertAndOpen("Connection successful!", "success");
        StateManager.updatePlaid();
      }else {
        StateManager.setAlertAndOpen("Connection failed", "error");
      }
    });
  }, []);

  const config = {
    token,
    onSuccess,
    // Optionally include other configurations
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button variant="contained" color="primary" style={{marginTop: '20px'}}  onClick={() => open()} disabled={!ready}>
      Connect an account
    </Button>
  );
};

export default PlaidLinkButton;