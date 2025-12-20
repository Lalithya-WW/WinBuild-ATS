import React, { useState, useEffect } from 'react';
import './InterviewScheduling.css';

const InterviewScheduling = ({ onBack }) => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [panelMembers, setPanelMembers] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPanelMembers, setSelectedPanelMembers] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, jobsRes, panelRes, interviewsRes] = await Promise.all([
        fetch('http://localhost:5001/api/interview-scheduling/candidates'),
        fetch('http://localhost:5001/api/interview-scheduling/jobs'),
        fetch('http://localhost:5001/api/interview-scheduling/panel-members'),
        fetch('http://localhost:5001/api/interview-scheduling/scheduled')
      ]);

      const candidatesData = await candidatesRes.json();
      const jobsData = await jobsRes.json();
      const panelData = await panelRes.json();
      const interviewsData = await interviewsRes.json();

      setCandidates(candidatesData);
      setJobs(jobsData);
      setPanelMembers(panelData);
      setScheduledInterviews(interviewsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePanelMemberToggle = (member) => {
    setSelectedPanelMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidate || !selectedJob || !interviewType || !interviewDate || !interviewTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedPanelMembers.length === 0) {
      alert('Please select at least one panel member');
      return;
    }

    setSubmitting(true);

    try {
      const candidate = candidates.find(c => c.id === selectedCandidate || c.id === parseInt(selectedCandidate));
      const job = jobs.find(j => j.id === selectedJob || j.title === selectedJob);

      const formattedDate = new Date(interviewDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const interviewData = {
        candidateName: candidate?.name || 'Unknown',
        candidateEmail: candidate?.email || '',
        jobPosition: job?.title || selectedJob,
        interviewType,
        date: formattedDate,
        time: interviewTime,
        location: location || 'To be confirmed',
        panelMembers: selectedPanelMembers.map(m => m.name),
        additionalNotes
      };

      const response = await fetch('http://localhost:5001/api/interview-scheduling/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      if (response.ok) {
        alert('Interview scheduled successfully!');
        // Reset form
        setSelectedCandidate('');
        setSelectedJob('');
        setInterviewType('');
        setInterviewDate('');
        setInterviewTime('');
        setLocation('');
        setSelectedPanelMembers([]);
        setAdditionalNotes('');
        // Refresh interviews list
        fetchData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      const errorMessage = error.message || 'Failed to schedule interview. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setSelectedCandidate('');
    setSelectedJob('');
    setInterviewType('');
    setInterviewDate('');
    setInterviewTime('');
    setLocation('');
    setSelectedPanelMembers([]);
    setAdditionalNotes('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Interview Scheduling...</p>
      </div>
    );
  }

  return (
    <div className="interview-scheduling">
      <div className="interview-scheduling-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="header-content">
          <h2>Interview Scheduling Screen</h2>
          <p>Coordinate and schedule candidate interviews</p>
        </div>
      </div>

      <div className="interview-scheduling-content">
        {/* Left Panel - Interview Details Form */}
        <div className="interview-form-panel">
          <h3>Interview Details</h3>
          <p className="form-subtitle">Fill in the information to schedule a new interview</p>

          <form onSubmit={handleSubmit}>
            {/* Select Candidate */}
            <div className="form-group">
              <label>
                Select Candidate <span className="required">*</span>
              </label>
              <select 
                value={selectedCandidate} 
                onChange={(e) => setSelectedCandidate(e.target.value)}
                required
              >
                <option value="">Select a candidate...</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} {candidate.status && `(${candidate.status})`}
                  </option>
                ))}
              </select>
              {selectedCandidate && (
                <div className="candidate-info">
                  {candidates.find(c => c.id === selectedCandidate || c.id === parseInt(selectedCandidate))?.email}
                </div>
              )}
            </div>

            {/* Job Position */}
            <div className="form-group">
              <label>
                Job Position <span className="required">*</span>
              </label>
              <select 
                value={selectedJob} 
                onChange={(e) => setSelectedJob(e.target.value)}
                required
              >
                <option value="">Select job position...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Interview Type */}
            <div className="form-group">
              <label>
                Interview Type <span className="required">*</span>
              </label>
              <select 
                value={interviewType} 
                onChange={(e) => setInterviewType(e.target.value)}
                required
              >
                <option value="">Select interview type...</option>
                <option value="Technical Round">Technical Round</option>
                <option value="Behavioral Round">Behavioral Round</option>
                <option value="HR Round">HR Round</option>
                <option value="Design Review">Design Review</option>
                <option value="Final Round">Final Round</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="form-row">
              <div className="form-group">
                <label>
                  Interview Date <span className="required">*</span>
                </label>
                <input 
                  type="date" 
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Interview Time <span className="required">*</span>
                </label>
                <input 
                  type="time" 
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Location / Meeting Link */}
            <div className="form-group">
              <label>Location / Meeting Link</label>
              <input 
                type="text" 
                placeholder="Conference Room A or Zoom link..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Interview Panel Members */}
            <div className="form-group">
              <label>
                Interview Panel Members <span className="required">*</span>
              </label>
              <p className="field-help">Select one or more interviewers for this session</p>
              <div className="panel-members-list">
                {panelMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className={`panel-member ${selectedPanelMembers.some(m => m.id === member.id) ? 'selected' : ''}`}
                    onClick={() => handlePanelMemberToggle(member)}
                  >
                    <div className="member-avatar">{member.initials}</div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-role">{member.role}</div>
                      <div className="member-email">{member.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label>Additional Notes (Optional)</label>
              <textarea 
                placeholder="Any special instructions or notes for the interview..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Scheduling...' : 'Schedule Interview'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleClearForm}
              >
                Clear Form
              </button>
            </div>

            <p className="form-footer">
              * Please fill all required fields to schedule an interview
            </p>
          </form>
        </div>

        {/* Right Panel - Upcoming Interviews & Quick Tips */}
        <div className="interview-sidebar">
          {/* Upcoming Interviews */}
          <div className="upcoming-interviews">
            <h3>📅 Upcoming Interviews</h3>
            <p className="sidebar-subtitle">Scheduled interviews this week</p>
            
            <div className="interviews-list">
              {scheduledInterviews.length === 0 ? (
                <p className="no-interviews">No upcoming interviews scheduled</p>
              ) : (
                scheduledInterviews.map((interview) => (
                  <div key={interview.id} className="interview-card">
                    <div className="interview-header">
                      <h4>{interview.candidateName}</h4>
                      <span className="interview-badge">{interview.interviewType}</span>
                    </div>
                    <p className="interview-position">{interview.jobPosition}</p>
                    <div className="interview-details">
                      <div className="detail-item">
                        📅 {interview.date}
                      </div>
                      <div className="detail-item">
                        🕐 {interview.time}
                      </div>
                      <div className="detail-item">
                        📍 {interview.location}
                      </div>
                      {interview.panelMembers && interview.panelMembers.length > 0 && (
                        <div className="detail-item">
                          👥 {interview.panelMembers.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="quick-tips">
            <h3>💡 Quick Tips</h3>
            <ul>
              <li>Select multiple panel members for comprehensive evaluation</li>
              <li>Schedule at least 2 days in advance for better coordination</li>
              <li>Add Zoom links or room numbers in the location field</li>
              <li>Notifications will be sent to all participants upon scheduling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduling;
