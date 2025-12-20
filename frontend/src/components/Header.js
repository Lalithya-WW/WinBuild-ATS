import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import './Header.css';

const Header = ({ user }) => {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: "/",
      mainWindowRedirectUri: "/"
    });
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-text">
              <div className="logo-title">
                <span className="logo-win">Win</span><span className="logo-ats">ATS</span>
              </div>
              <div className="logo-subtitle">Applicant Tracking System</div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-badge">4</span>
          </button>

          <div className="user-info">
            <span className="user-email">{user?.email || 'user@winwire.com'}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
