import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onCreateJob, onUploadResume }) => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [jobData, setJobData] = useState({ title: '', department: '', location: '' });
  const [resumeData, setResumeData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    position: '', 
    status: 'active' 
  });

  const handleCreateJob = (e) => {
    e.preventDefault();
    onCreateJob(jobData);
    setJobData({ title: '', department: '', location: '' });
    setShowJobModal(false);
  };

  const handleUploadResume = (e) => {
    e.preventDefault();
    onUploadResume(resumeData);
    setResumeData({ 
      name: '', 
      email: '', 
      phone: '', 
      position: '', 
      status: 'active' 
    });
    setShowResumeModal(false);
  };

  return (
    <div className="quick-actions">
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
        <p className="section-subtitle">Common tasks for Recruiters</p>
      </div>

      <div className="actions-grid">
        <button className="action-card" onClick={() => setShowJobModal(true)}>
          <div className="action-icon create-job">
            <Plus size={24} />
          </div>
          <div className="action-content">
            <h3 className="action-title">Create Job</h3>
            <p className="action-description">Post a new job opening</p>
          </div>
        </button>

        <button className="action-card" onClick={() => setShowResumeModal(true)}>
          <div className="action-icon upload-resume">
            <Upload size={24} />
          </div>
          <div className="action-content">
            <h3 className="action-title">Upload Resume</h3>
            <p className="action-description">Screen new candidates</p>
          </div>
        </button>
      </div>

      {/* Create Job Modal */}
      {showJobModal && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Job</h2>
            <form onSubmit={handleCreateJob}>
              <input
                type="text"
                placeholder="Job Title"
                value={jobData.title}
                onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Department"
                value={jobData.department}
                onChange={(e) => setJobData({ ...jobData, department: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={jobData.location}
                onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="primary">Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Resume Modal */}
      {showResumeModal && (
        <div className="modal-overlay" onClick={() => setShowResumeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Candidate</h2>
            <form onSubmit={handleUploadResume}>
              <input
                type="text"
                placeholder="Candidate Name"
                value={resumeData.name}
                onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={resumeData.email}
                onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={resumeData.phone}
                onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Position Applied For"
                value={resumeData.position}
                onChange={(e) => setResumeData({ ...resumeData, position: e.target.value })}
                required
              />
              <select
                value={resumeData.status}
                onChange={(e) => setResumeData({ ...resumeData, status: e.target.value })}
                required
              >
                <option value="active">Active</option>
                <option value="screening">Screening</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Extended</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowResumeModal(false)}>Cancel</button>
                <button type="submit" className="primary">Add Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
