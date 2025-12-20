import React from 'react';
import './AzureLogin.css';

const AzureLogin = ({ onLogin, userName }) => {
  return (
    <div className="azure-login-container">
      <div className="azure-login-card">
        <div className="azure-login-header">
          <div className="azure-logo-container">
            <svg className="azure-logo" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="azure-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0078D4', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#00BCF2', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path fill="url(#azure-gradient)" d="M38.4 20.4L15.6 66h17.6l13.2-31.2 20.4 31.2H96L38.4 20.4zM0 70.8L19.2 96h38.4L33.6 70.8H0z"/>
            </svg>
          </div>
          <h1 className="azure-login-title">AI Talent Systems</h1>
          <p className="azure-login-subtitle">Sign in with your organization account</p>
        </div>
        
        <div className="azure-login-body">
          {userName ? (
            <div className="user-info">
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{userName}</p>
                <p className="user-status">Signed in</p>
              </div>
            </div>
          ) : (
            <button className="azure-login-button" onClick={onLogin}>
              <svg className="microsoft-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="11" height="11" fill="#f25022"/>
                <rect x="12" y="0" width="11" height="11" fill="#7fba00"/>
                <rect x="0" y="12" width="11" height="11" fill="#00a4ef"/>
                <rect x="12" y="12" width="11" height="11" fill="#ffb900"/>
              </svg>
              <span>Sign in with Microsoft</span>
            </button>
          )}
        </div>
        
        <div className="azure-login-footer">
          <p className="footer-text">
            Protected by Azure Active Directory
          </p>
          <div className="footer-links">
            <a href="#terms">Terms of use</a>
            <span className="separator">•</span>
            <a href="#privacy">Privacy & cookies</a>
          </div>
        </div>
      </div>
      
      <div className="background-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default AzureLogin;
