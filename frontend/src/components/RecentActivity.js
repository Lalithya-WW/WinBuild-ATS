import React from 'react';
import { UserPlus, Calendar, ArrowRight, CheckCircle, Upload, Briefcase } from 'lucide-react';
import './RecentActivity.css';

const RecentActivity = ({ activities }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'application':
        return <UserPlus size={18} />;
      case 'interview':
        return <Calendar size={18} />;
      case 'status':
        return <ArrowRight size={18} />;
      case 'offer':
        return <CheckCircle size={18} />;
      case 'job':
        return <Briefcase size={18} />;
      case 'upload':
        return <Upload size={18} />;
      default:
        return <UserPlus size={18} />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'application':
        return '#3b82f6';
      case 'interview':
        return '#8b5cf6';
      case 'status':
        return '#06b6d4';
      case 'offer':
        return '#10b981';
      case 'job':
        return '#f59e0b';
      case 'upload':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="recent-activity">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Activity</h2>
          <p className="section-subtitle">Latest updates and actions</p>
        </div>
      </div>

      <div className="activity-list">
        {activities && activities.length > 0 ? (
          activities.slice(0, 4).map((activity) => (
            <div key={activity.id} className="activity-item">
              <div 
                className="activity-icon" 
                style={{ backgroundColor: `${getIconColor(activity.type)}15`, color: getIconColor(activity.type) }}
              >
                {getIcon(activity.type)}
              </div>
              <div className="activity-content">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-description">{activity.description}</p>
                <span className="activity-time">{activity.timestamp}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-activities">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
