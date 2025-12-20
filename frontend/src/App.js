import React, { useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
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
import ResumeScreening from './components/ResumeScreening';
import CandidatePipeline from './components/CandidatePipeline';
import InterviewScheduling from './components/InterviewScheduling';
import InterviewFeedback from './components/InterviewFeedback';
import OfferManagement from './components/OfferManagement';
import AzureLogin from './components/AzureLogin';
import * as api from './services/api';
import { msalInstance, loginRequest } from './authConfig';

function Dashboard() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showResumeScreening, setShowResumeScreening] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      getUserInfo();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getUserInfo = async () => {
    const accounts = instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      setUser({
        name: account.name || account.username,
        email: account.username,
        role: 'Recruiter'
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData, notificationsData] = await Promise.all([
        api.getStats(),
        api.getActivities(),
        api.getNotifications()
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
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

  // Show login screen if not authenticated
  if (!isAuthenticated && inProgress === InteractionStatus.None) {
    return <AzureLogin onLogin={handleLogin} />;
  }

  if (loading || inProgress !== InteractionStatus.None) {
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
            Interview Scheduling
          </button>
          <button 
            className={`tab ${activeTab === 'resumeScreening' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('resumeScreening');
              setShowResumeScreening(true);
            }}
          >
            AI Resume Screening
          </button>
          <button 
            className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            Candidate Pipeline
          </button>
          <button 
            className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Interview Feedback
          </button>
          <button 
            className={`tab ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            Offer Management
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
        {activeTab === 'interviews' && <InterviewScheduling />}
        {activeTab === 'pipeline' && <CandidatePipeline />}
        {activeTab === 'feedback' && (
          <InterviewFeedback 
            onBack={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'resumeScreening' && (
          <ResumeScreening 
            onBack={() => {
              setActiveTab('dashboard');
              setShowResumeScreening(false);
            }}
          />
        )}
        {activeTab === 'offers' && (
          <OfferManagement 
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        <DemoMode />
      </main>
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Dashboard />
    </MsalProvider>
  );
}

export default App;
