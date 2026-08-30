import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance, msalRedirect } from './config/msalConfig.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <MsalProvider instance={msalInstance}>
          {/* BrowserRouter MUST be here, wrapping the AuthProvider */}
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </MsalProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
};


msalInstance
  .initialize()
  .then(() => msalInstance.handleRedirectPromise())
  .then((result) => {
    if (result) {
      msalRedirect.result = result;
      msalInstance.setActiveAccount(result.account);
    }
    renderApp();
  })
  .catch((err) => {
    console.error('MSAL startup error:', err);
    renderApp();
  });