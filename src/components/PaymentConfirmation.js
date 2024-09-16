import React, {useState, useEffect} from 'react';
import {useStripe, Elements} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Make sure to call `loadStripe` outside of a component’s render to avoid recreating the `Stripe` object on every render.
const stripeKey = process.env.NODE_ENV === "development" ? 'pk_test_TKhGrmB7K2upBFGy2x7KSP6e0002WFRtWs' : "pk_live_ItQHT80SBCB2LpW3zkZW84sP00RnGbxWjs";
const stripePromise = loadStripe(stripeKey);

const icons = {
  succeeded: <DoneOutlineIcon color="success" style={{ fontSize: 60, color: "green" }} />,
  processing: <HourglassEmptyIcon color="secondary" style={{ fontSize: 60, color: "gold"  }} />,
  requires_payment_method: <ErrorIcon color="error" style={{ fontSize: 60, color: "red" }} />,
  default: null,
};

const PaymentStatus = (props) => {
  const stripe = useStripe();
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter appended to
    // your return_url by Stripe.js
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // Retrieve the PaymentIntent
    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({paymentIntent}) => {
        // Inspect the PaymentIntent `status` to indicate the status of the payment
        // to your customer.
        //
        // Some payment methods will [immediately succeed or fail][0] upon
        // confirmation, while others will first enter a `processing` state.
        //
        // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
        setStatus(paymentIntent.status);
        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage('Success! Payment received.');
            break;

          case 'processing':
            setMessage("Payment processing. It has been properly submitted and ee'll update you when payment is received.");
            break;

          case 'requires_payment_method':
            // Redirect your user back to your payment page to attempt collecting
            // payment again
            setMessage('Payment failed. Please try another payment method.');
            break;

          default:
            setMessage('Something went wrong.');
            break;
        }
      });
  }, [stripe]);


  return (
    <>
      {icons[status]}
      <h2>
        {message}
      </h2>
    </>
  );
};


const PaymentConfirmation = (props) => {
  return (
    <>
      <Elements stripe={stripePromise}>
        <PaymentStatus {...props} />
      </Elements>
    </>

  );
};

export default PaymentConfirmation;