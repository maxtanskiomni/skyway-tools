import React from 'react';
import { PaymentElement, CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@mui/material';
import { StateManager } from '../utilities/stateManager';

// Make sure to call `loadStripe` outside of a component’s render to avoid recreating the `Stripe` object on every render.
const stripeKey = process.env.NODE_ENV === "development" ? 'pk_test_TKhGrmB7K2upBFGy2x7KSP6e0002WFRtWs' : "pk_live_ItQHT80SBCB2LpW3zkZW84sP00RnGbxWjs";
const stripePromise = loadStripe(stripeKey);

const CheckoutForm = (props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setErrorMessage] = React.useState(null);

  const handleSubmit = async (e) => {
    // We don't want to let default form submission happen here, which would refresh the page.

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    StateManager.setLoading(true);

    // const card = elements.getElement(PaymentElement);
    // const result = await stripe.createToken(card);

    const {error} = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-status`,
      },
    });

    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer (for example, payment
      // details incomplete)
      setErrorMessage(error.message);
    } 
    StateManager.setLoading(false);
  };

  return (
    <>
      {message && <h3>{message}</h3>}
      <PaymentElement />
      <Button 
        disabled={!stripe} 
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        style={{marginTop: "3vh", padding: 10}}
      >
        <b>Pay ${(Number(props.amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</b>
      </Button>
    </>
  );
};

const PaymentForm = (props) => {
  const options = {
    // passing the client secret obtained in step 3
    clientSecret: props.intent,
    // Fully customizable with appearance API.
    appearance: {/*...*/},
  };
  
  return (
    <>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm {...props} />
      </Elements>
    </>

  );
};

export default PaymentForm;