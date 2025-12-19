import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Briefcase, Trash2, Edit } from 'lucide-react';
import * as api from '../services/api';
import './InterviewsList.css';

const InterviewsList = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await api.getInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this interview?')) {
      try {
        await api.deleteInterview(id);
        fetchInterviews();
      } catch (error) {
        console.error('Error deleting interview:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading interviews...</div>;
  }

  return (
    <div className="interviews-list">
      <div className="section-header">
        <h2 className="section-title">Interviews</h2>
        <p className="section-subtitle">Scheduled interviews and assessments</p>
      </div>

      <div className="interviews-grid">
        {interviews.map((interview) => (
          <div key={interview.id} className={`interview-card ${interview.status}`}>
            <div className="interview-header">
              <span className={`interview-status ${interview.status}`}>
                {interview.status}
              </span>
              <div className="interview-actions">
                <button className="btn-icon">
                  <Edit size={16} />
                </button>
                <button 
                  className="btn-icon btn-delete" 
                  onClick={() => handleDelete(interview.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="interview-candidate">
              <User size={20} />
              <h3>{interview.candidateName}</h3>
            </div>

            <div className="interview-details">
              <div className="interview-detail">
                <Briefcase size={16} />
                <span>{interview.position}</span>
              </div>
              <div className="interview-detail">
                <Clock size={16} />
                <span>{interview.interviewType}</span>
              </div>
              <div className="interview-detail">
                <Calendar size={16} />
                <span>{formatDate(interview.scheduleDate)}</span>
              </div>
            </div>

            {interview.feedback && (
              <div className="interview-feedback">
                <strong>Feedback:</strong>
                <p>{interview.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewsList;
