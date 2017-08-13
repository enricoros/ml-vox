import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import {BrowserRouter} from "react-router-dom";
import App from "./App";

// Google Analytics code
ReactGA.initialize('UA-65634159-4', {debug: true});

ReactDOM.render((
  <BrowserRouter>
    <App/>
  </BrowserRouter>
), document.getElementById('root'));
