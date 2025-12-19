import React from 'react';
import { AlertCircle, Clock, FileText } from 'lucide-react';
import './Notifications.css';

const Notifications = ({ notifications }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'feedback':
        return <AlertCircle size={20} />;
      case 'interview':
        return <Clock size={20} />;
      case 'approval':
        return <FileText size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div className="notifications-icon">
          <AlertCircle size={20} />
        </div>
        <h2 className="notifications-title">Notifications</h2>
      </div>
      <p className="notifications-subtitle">Action items requiring attention</p>

      <div className="notifications-list">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <div 
                className="notification-indicator"
                style={{ backgroundColor: getPriorityColor(notification.priority) }}
              />
              <div className="notification-icon" style={{ color: getPriorityColor(notification.priority) }}>
                {getIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-description">{notification.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-notifications">No new notifications</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;
