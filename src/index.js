import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, StyledEngineProvider, createTheme, adaptV4Theme } from '@mui/material/styles';

require("./utilities/protos");

const theme = createTheme(adaptV4Theme({
  palette: {
    primary: {
      light: '#fff',
      main: '#023e84',
      dark: '#777'
    },
    secondary: {
      main: '#ca9f6b',
    },
    warning: {
      main: '#FFFF00',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: { 
      useNextVariants: true
  }
}));

ReactDOM.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme} ><App/></ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
