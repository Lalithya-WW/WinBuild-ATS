import React from 'react';
import { Info } from 'lucide-react';
import './DemoMode.css';

const DemoMode = () => {
  return (
    <div className="demo-mode">
      <div className="demo-content">
        <div className="demo-icon">
          <Info size={20} />
        </div>
        <div className="demo-text">
          <h3>Demo Mode</h3>
          <p>This is a demonstration environment. Your role (Recruiter) last session data are stored locally and will persist until you log out.</p>
        </div>
      </div>
    </div>
  );
};

export default DemoMode;
