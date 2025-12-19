import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import Notifications from './components/Notifications';
import DemoMode from './components/DemoMode';
import JobsList from './components/JobsList';
import CandidatesList from './components/CandidatesList';
import InterviewsList from './components/InterviewsList';
import * as api from './services/api';

function App() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData, notificationsData, userData] = await Promise.all([
        api.getStats(),
        api.getActivities(),
        api.getNotifications(),
        api.getUser()
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setNotifications(notificationsData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      await api.createJob(jobData);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleUploadResume = async (resumeData) => {
    try {
      await api.createCandidate(resumeData);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error uploading resume:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header user={user} />
      
      <main className="main-content">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome back, {user?.name}!</h1>
          <p className="welcome-subtitle">
            You're logged in as <strong>{user?.role}</strong>. Here's your dashboard overview for today.
          </p>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button 
            className={`tab ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            Candidates
          </button>
          <button 
            className={`tab ${activeTab === 'interviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('interviews')}
          >
            Interviews
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <StatsCards stats={stats} />

            <div className="dashboard-grid">
              <div className="left-column">
                <QuickActions 
                  onCreateJob={handleCreateJob}
                  onUploadResume={handleUploadResume}
                />
                <RecentActivity activities={activities} />
              </div>

              <div className="right-column">
                <Notifications notifications={notifications} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'jobs' && <JobsList />}
        {activeTab === 'candidates' && <CandidatesList />}
        {activeTab === 'interviews' && <InterviewsList />}

        <DemoMode />
      </main>
    </div>
  );
}

export default App;
