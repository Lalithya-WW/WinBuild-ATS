import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import './Header.css';

const Header = ({ user }) => {
  const handleLogout = () => {
    // Handle logout logic
    console.log('Logout clicked');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">W</div>
            <div className="logo-text">
              <div className="logo-title">WinWire <span className="ats-badge">ATS</span></div>
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

          <button className="recruiter-btn">Recruiter</button>

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
