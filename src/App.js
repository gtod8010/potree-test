import React, { useState, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/core';
import routes from './routes';
import theme from './theme';
import './App.css';


const App = () => {
  const routing = useRoutes(routes);
  useEffect(() => {
    console.log('reload');
  }, []);
  return (
    <ThemeProvider theme={theme}>
        {routing}
        </ThemeProvider>
  );
};

export default App;
