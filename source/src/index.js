// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routing } from './routing';
import { Amplify } from 'aws-amplify';
import { AWS_REGION } from './config';
import { USER_POOL_ID } from './config';
import { USER_POOL_WEB_CLIENT_ID } from './config';


Amplify.configure({
    Auth: {
        region: AWS_REGION,
        userPoolId: USER_POOL_ID,
        userPoolWebClientId: USER_POOL_WEB_CLIENT_ID
    }
})

// Auth.signIn(username, password)
//   .then(user => {
//     // You can call currentSession here to retrieve the user's session.
//     const session = Auth.currentSession();
//     console.log(session);
//   })
//   .catch(error => {
//     console.log(error);
//   });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routing />
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
