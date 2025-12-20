import React, { useState, useEffect } from 'react';
import './InterviewFeedback.css';

const InterviewFeedback = ({ onBack }) => {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'history'
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [formData, setFormData] = useState({
    technicalSkills: 0,
    communication: 0,
    problemSolving: 0,
    cultureFit: 0,
    overallRating: 0,
    keyStrengths: '',
    areasOfConcern: '',
    additionalComments: '',
    recommendation: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/interview-feedback/interviews');
      const data = await response.json();
      setInterviews(data);
      if (data.length > 0) {
        setSelectedInterview(data[0]);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const response = await fetch('http://localhost:5001/api/interview-feedback/feedbacks');
      const data = await response.json();
      setSubmittedFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleInterviewSelect = (interview) => {
    setSelectedInterview(interview);
    // Reset form when changing interview
    setFormData({
      technicalSkills: 0,
      communication: 0,
      problemSolving: 0,
      cultureFit: 0,
      overallRating: 0,
      keyStrengths: '',
      areasOfConcern: '',
      additionalComments: '',
      recommendation: ''
    });
  };

  const handleRatingChange = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRecommendationChange = (recommendation) => {
    setFormData(prev => ({
      ...prev,
      recommendation
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.overallRating) {
      alert('Please provide an overall rating');
      return;
    }
    if (!formData.recommendation) {
      alert('Please select a recommendation');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('http://localhost:5001/api/interview-feedback/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interviewId: selectedInterview.id,
          candidateName: selectedInterview.candidateName,
          position: selectedInterview.position,
          dateTime: selectedInterview.dateTime,
          ...formData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Store in local state
        setSubmittedFeedbacks(prev => [result.feedback, ...prev]);
        alert('Feedback submitted successfully!');
        handleClearForm();
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      technicalSkills: 0,
      communication: 0,
      problemSolving: 0,
      cultureFit: 0,
      overallRating: 0,
      keyStrengths: '',
      areasOfConcern: '',
      additionalComments: '',
      recommendation: ''
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const StarRating = ({ rating, onChange, label, description }) => {
    return (
      <div className="rating-item">
        <div className="rating-header">
          <span className="rating-label">{label}</span>
        </div>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? 'filled' : ''}`}
              onClick={() => onChange(star)}
            >
              ★
            </span>
          ))}
        </div>
        <div className="rating-description">{description}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="interview-feedback">
        <div className="loading">Loading interviews...</div>
      </div>
    );
  }

  if (!selectedInterview && viewMode === 'form') {
    return (
      <div className="interview-feedback">
        <div className="no-interviews">No interviews available</div>
      </div>
    );
  }

  return (
    <div className="interview-feedback">
      <div className="feedback-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="header-content">
          <div className="header-icon">💼</div>
          <div className="header-text">
            <h1>Interview Feedback</h1>
            <p>Provide structured feedback on candidate performance</p>
          </div>
        </div>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => setViewMode('form')}
          >
            📝 Submit Feedback
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('history');
              fetchSubmittedFeedbacks();
            }}
          >
            📋 View History ({submittedFeedbacks.length})
          </button>
        </div>
      </div>

      {viewMode === 'form' && selectedInterview && (
        <div className="feedback-container">
          <div className="section">
          <h2>Select Interview</h2>
          <p className="section-description">
            Choose the interview you want to provide feedback for
          </p>
          <div className="interview-select">
            <select 
              value={selectedInterview.id} 
              onChange={(e) => {
                const interview = interviews.find(i => i.id === e.target.value);
                handleInterviewSelect(interview);
              }}
            >
              {interviews.map((interview) => (
                <option key={interview.id} value={interview.id}>
                  {interview.candidateName} - {interview.position}
                </option>
              ))}
            </select>
          </div>

          <div className="interview-details">
            <div className="detail-item">
              <span className="detail-icon">👤</span>
              <div>
                <div className="detail-label">Candidate</div>
                <div className="detail-value">{selectedInterview.candidateName}</div>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">💼</span>
              <div>
                <div className="detail-label">Position</div>
                <div className="detail-value">{selectedInterview.position}</div>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <div>
                <div className="detail-label">Date & Time</div>
                <div className="detail-value">{formatDateTime(selectedInterview.dateTime)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Evaluation Criteria</h2>
          <p className="section-description">
            Rate the candidate on each criterion (1-5 stars)
          </p>

          <div className="ratings">
            <StarRating
              label="Technical Skills"
              rating={formData.technicalSkills}
              onChange={(rating) => handleRatingChange('technicalSkills', rating)}
              description="Programming knowledge, technical expertise, and problem-solving abilities"
            />
            <StarRating
              label="Communication"
              rating={formData.communication}
              onChange={(rating) => handleRatingChange('communication', rating)}
              description="Clarity of thought, articulation, and listening skills"
            />
            <StarRating
              label="Problem Solving"
              rating={formData.problemSolving}
              onChange={(rating) => handleRatingChange('problemSolving', rating)}
              description="Analytical thinking, creativity, and approach to challenges"
            />
            <StarRating
              label="Culture Fit"
              rating={formData.cultureFit}
              onChange={(rating) => handleRatingChange('cultureFit', rating)}
              description="Alignment with company values and team dynamics"
            />
            <StarRating
              label="Overall Rating"
              rating={formData.overallRating}
              onChange={(rating) => handleRatingChange('overallRating', rating)}
              description="Your overall impression of the candidate"
            />
            {formData.overallRating === 0 && (
              <div className="required-badge">Required</div>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Detailed Feedback</h2>
          <p className="section-description">
            Provide specific comments about the candidate's performance
          </p>

          <div className="feedback-field">
            <label>
              <span className="field-icon">✅</span>
              Key Strengths
            </label>
            <textarea
              placeholder="What did the candidate do particularly well? Highlight specific examples..."
              value={formData.keyStrengths}
              onChange={(e) => handleInputChange('keyStrengths', e.target.value)}
              rows={4}
            />
          </div>

          <div className="feedback-field">
            <label>
              <span className="field-icon">⚠️</span>
              Areas of Concern
            </label>
            <textarea
              placeholder="What areas need improvement? Any red flags or concerns..."
              value={formData.areasOfConcern}
              onChange={(e) => handleInputChange('areasOfConcern', e.target.value)}
              rows={4}
            />
          </div>

          <div className="feedback-field">
            <label>
              Additional Comments (Optional)
            </label>
            <textarea
              placeholder="Any other observations or notes about the interview..."
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="section">
          <h2>Final Recommendation</h2>
          {formData.recommendation === '' && (
            <div className="required-badge">Required</div>
          )}
          <p className="section-description">
            Would you recommend this candidate for hire?
          </p>

          <div className="recommendation-buttons">
            <button
              className={`recommendation-btn recommend ${formData.recommendation === 'hire' ? 'active' : ''}`}
              onClick={() => handleRecommendationChange('hire')}
            >
              <span className="btn-icon">👍</span>
              <div className="btn-content">
                <div className="btn-title">Recommend to Hire</div>
                <div className="btn-subtitle">Move candidate forward in the process</div>
              </div>
            </button>

            <button
              className={`recommendation-btn not-recommend ${formData.recommendation === 'reject' ? 'active' : ''}`}
              onClick={() => handleRecommendationChange('reject')}
            >
              <span className="btn-icon">👎</span>
              <div className="btn-content">
                <div className="btn-title">Do Not Recommend</div>
                <div className="btn-subtitle">Candidate not suitable for this role</div>
              </div>
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            📤 {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button 
            className="clear-btn" 
            onClick={handleClearForm}
            disabled={submitting}
          >
            Clear Form
          </button>
        </div>
      </div>
      )}

      {viewMode === 'history' && (
        <div className="feedback-history">
          <h2>📋 Submitted Feedback History</h2>
          {loadingFeedbacks ? (
            <div className="loading">Loading feedback history...</div>
          ) : submittedFeedbacks.length === 0 ? (
            <div className="no-feedback">
              <p>No feedback submitted yet</p>
              <button className="toggle-btn" onClick={() => setViewMode('form')}>
                Submit Your First Feedback
              </button>
            </div>
          ) : (
            <div className="feedback-cards">
              {submittedFeedbacks.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="card-header">
                    <div className="candidate-info">
                      <h3>{feedback.candidateName}</h3>
                      <p className="position">{feedback.position}</p>
                    </div>
                    <div className={`recommendation-badge ${feedback.recommendation}`}>
                      {feedback.recommendation === 'hire' ? '✅ Recommended' : '❌ Not Recommended'}
                    </div>
                  </div>
                  
                  <div className="card-meta">
                    <span>📅 {new Date(feedback.dateTime).toLocaleDateString()}</span>
                    <span>🕒 Submitted: {new Date(feedback.submittedAt).toLocaleString()}</span>
                  </div>

                  <div className="ratings-summary">
                    <div className="rating-pill">
                      <span className="label">Technical:</span>
                      <span className="stars-small">{'★'.repeat(feedback.ratings.technicalSkills)}{'☆'.repeat(5-feedback.ratings.technicalSkills)}</span>
                    </div>
                    <div className="rating-pill">
                      <span className="label">Communication:</span>
                      <span className="stars-small">{'★'.repeat(feedback.ratings.communication)}{'☆'.repeat(5-feedback.ratings.communication)}</span>
                    </div>
                    <div className="rating-pill">
                      <span className="label">Problem Solving:</span>
                      <span className="stars-small">{'★'.repeat(feedback.ratings.problemSolving)}{'☆'.repeat(5-feedback.ratings.problemSolving)}</span>
                    </div>
                    <div className="rating-pill">
                      <span className="label">Culture Fit:</span>
                      <span className="stars-small">{'★'.repeat(feedback.ratings.cultureFit)}{'☆'.repeat(5-feedback.ratings.cultureFit)}</span>
                    </div>
                    <div className="rating-pill overall">
                      <span className="label">Overall:</span>
                      <span className="stars-small">{'★'.repeat(feedback.ratings.overallRating)}{'☆'.repeat(5-feedback.ratings.overallRating)}</span>
                    </div>
                  </div>

                  {feedback.feedback.keyStrengths && (
                    <div className="feedback-section">
                      <strong>✅ Key Strengths:</strong>
                      <p>{feedback.feedback.keyStrengths}</p>
                    </div>
                  )}

                  {feedback.feedback.areasOfConcern && (
                    <div className="feedback-section">
                      <strong>⚠️ Areas of Concern:</strong>
                      <p>{feedback.feedback.areasOfConcern}</p>
                    </div>
                  )}

                  {feedback.feedback.additionalComments && (
                    <div className="feedback-section">
                      <strong>💬 Additional Comments:</strong>
                      <p>{feedback.feedback.additionalComments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewFeedback;
