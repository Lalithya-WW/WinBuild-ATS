import React, { useState, useEffect } from 'react';
import './OnboardingHandoff.css';

const OnboardingHandoff = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateData();
    }
  }, [candidateId]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/onboarding/${candidateId}`);
      const data = await response.json();
      
      if (data.success) {
        setCandidate(data.candidate);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch candidate data');
      }
    } catch (err) {
      console.error('Error fetching candidate data:', err);
      setError('Failed to load candidate information');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToOnboarding = async () => {
    try {
      setSending(true);
      const response = await fetch(`http://localhost:5000/api/onboarding/${candidateId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSent(true);
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      } else {
        setError(data.message || 'Failed to send to onboarding');
      }
    } catch (err) {
      console.error('Error sending to onboarding:', err);
      setError('Failed to send to onboarding team');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-handoff">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidate information...</p>
        </div>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="onboarding-handoff">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchCandidateData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="onboarding-handoff">
        <div className="error-state">
          <p className="error-message">No candidate data available</p>
          {onBack && <button onClick={onBack} className="back-btn">Go Back</button>}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    return status === 'completed' ? '✓' : '○';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="onboarding-handoff">
      {/* Header */}
      <div className="handoff-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <span>←</span> Back
          </button>
        )}
        <div className="header-content">
          <div className="header-icon">
            <span>📋</span>
          </div>
          <div className="header-text">
            <h1>Onboarding Handoff</h1>
            <p>Complete the hiring process and transfer to onboarding</p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {!sent ? (
        <div className="success-banner">
          <div className="banner-icon">✓</div>
          <div className="banner-content">
            <h2>Hiring Complete! 🎉</h2>
            <p>All recruitment steps are done. Ready to hand off to the onboarding team.</p>
          </div>
        </div>
      ) : (
        <div className="success-banner sent">
          <div className="banner-icon">✓</div>
          <div className="banner-content">
            <h2>Successfully Sent to Onboarding! 🎉</h2>
            <p>The candidate has been transferred to the onboarding team.</p>
          </div>
        </div>
      )}

      {/* Candidate Information */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-icon">👤</span>
          <h3>Candidate Information</h3>
        </div>
        <p className="section-subtitle">Complete profile summary for onboarding transfer</p>
        
        <div className="info-grid">
          <div className="info-card">
            <div className="candidate-profile">
              <div className="profile-avatar" style={{ backgroundColor: '#6B7280' }}>
                {candidate.name?.charAt(0) || 'C'}
              </div>
              <div className="profile-details">
                <p className="profile-label">Full Name</p>
                <h4>{candidate.name}</h4>
                {candidate.fitScore && (
                  <span className="fit-score-badge" style={{ backgroundColor: '#10B981' }}>
                    Fit Score: {candidate.fitScore}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <p className="contact-label">Email Address</p>
                  <p className="contact-value">{candidate.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div>
                  <p className="contact-label">Phone Number</p>
                  <p className="contact-value">{candidate.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <p className="contact-label">Location</p>
                  <p className="contact-value">{candidate.location || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <div className="job-details">
              <div className="detail-item">
                <span className="detail-icon">💼</span>
                <div>
                  <p className="detail-label">Job Title</p>
                  <p className="detail-value">{candidate.position || candidate.jobTitle || 'N/A'}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <span className="detail-icon">🏢</span>
                <div>
                  <p className="detail-label">Department</p>
                  <p className="detail-value">{candidate.department || 'N/A'}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <span className="detail-icon">👔</span>
                <div>
                  <p className="detail-label">Reporting Manager</p>
                  <p className="detail-value">{candidate.reportingManager || 'N/A'}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <p className="detail-label">Start Date</p>
                  <p className="detail-value">{formatDate(candidate.startDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-icon">📄</span>
          <h3>Employment Details</h3>
        </div>
        <p className="section-subtitle">Contract and compensation information</p>
        
        <div className="employment-grid">
          <div className="employment-card">
            <span className="employment-icon">💰</span>
            <div className="employment-content">
              <p className="employment-label">Base Salary</p>
              <h4 className="employment-value">
                ${candidate.baseSalary ? parseInt(candidate.baseSalary).toLocaleString() : '0'}
              </h4>
              <p className="employment-note">Yearly</p>
            </div>
          </div>
          
          <div className="employment-card">
            <span className="employment-icon">🏠</span>
            <div className="employment-content">
              <p className="employment-label">Work Model</p>
              <h4 className="employment-value">{candidate.workArrangement || 'N/A'}</h4>
              <p className="employment-note">Flexible schedule</p>
            </div>
          </div>
          
          <div className="employment-card">
            <span className="employment-icon">✅</span>
            <div className="employment-content">
              <p className="employment-label">Offer Accepted</p>
              <h4 className="employment-value">{formatDate(candidate.offerAcceptedDate)}</h4>
              <p className="employment-note">Contract Signed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment Journey */}
      <div className="info-section">
        <div className="section-header">
          <span className="section-icon">🗓️</span>
          <h3>Recruitment Journey</h3>
        </div>
        <p className="section-subtitle">Overview of the hiring process completed</p>
        
        <div className="journey-timeline">
          {candidate.journey && candidate.journey.map((step, index) => (
            <div key={index} className={`timeline-item ${step.status}`}>
              <div className="timeline-icon">{getStatusIcon(step.status)}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>{step.title}</h4>
                  {step.count && <span className="timeline-badge">{step.count}</span>}
                </div>
                <p className="timeline-date">{formatDate(step.date)}</p>
              </div>
              <div className="timeline-status-icon">✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready to Send */}
      <div className="ready-section">
        <div className="ready-card">
          <div className="ready-icon">🚀</div>
          <div className="ready-content">
            <h3>Ready to Send to Onboarding</h3>
            <p>All recruitment steps are complete. Click the button below to transfer this candidate to the onboarding team. They will handle:</p>
            <ul>
              <li>Equipment provisioning (laptop, access cards, etc.)</li>
              <li>IT account setup and system access</li>
              <li>First day orientation and paperwork</li>
              <li>Team introductions and workspace setup</li>
            </ul>
            <button 
              className="send-button"
              onClick={handleSendToOnboarding}
              disabled={sending || sent}
            >
              {sending ? 'Sending...' : sent ? 'Sent Successfully!' : 'Send to Onboarding Team'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message-inline">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingHandoff;
