import React, { useState, useEffect } from 'react';
import './CandidatePipeline.css';

const CandidatePipeline = () => {
  const [candidates, setCandidates] = useState([]);
  const [pipeline, setPipeline] = useState({
    Applied: [],
    Shortlisted: [],
    Interview: [],
    Offer: [],
    Hired: []
  });
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activePipeline: 0
  });
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stageConfig = [
    { name: 'Applied', icon: '👤', count: 0, color: '#6B7280' },
    { name: 'Shortlisted', icon: '📋', count: 0, color: '#3B82F6' },
    { name: 'Interview', icon: '📅', count: 0, color: '#8B5CF6' },
    { name: 'Offer', icon: '⏰', count: 0, color: '#F59E0B' },
    { name: 'Hired', icon: '✓', count: 0, color: '#10B981' }
  ];

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/candidate-pipeline');
      const data = await response.json();
      
      if (data.success) {
        setCandidates(data.candidates || []);
        setPipeline(data.pipeline || {
          Applied: [],
          Shortlisted: [],
          Interview: [],
          Offer: [],
          Hired: []
        });
        setStats(data.stats || {
          totalCandidates: 0,
          activePipeline: 0
        });
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch candidates');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidate pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedCandidate(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (stage) => {
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    
    if (!draggedCandidate || draggedCandidate.stage === targetStage) {
      setDragOverStage(null);
      return;
    }

    // Update the pipeline state
    const updatedPipeline = { ...pipeline };
    
    // Remove from old stage
    updatedPipeline[draggedCandidate.stage] = updatedPipeline[draggedCandidate.stage].filter(
      c => c.id !== draggedCandidate.id
    );
    
    // Add to new stage
    const updatedCandidate = { ...draggedCandidate, stage: targetStage };
    updatedPipeline[targetStage].push(updatedCandidate);
    
    setPipeline(updatedPipeline);
    
    // Update candidates list
    const updatedCandidates = candidates.map(c =>
      c.id === draggedCandidate.id ? updatedCandidate : c
    );
    setCandidates(updatedCandidates);
    
    // Update stats
    setStats({
      ...stats,
      activePipeline: updatedCandidates.filter(c => c.stage !== 'Hired').length
    });

    // Call API to update backend
    try {
      await fetch(`http://localhost:5001/api/candidate-pipeline/${draggedCandidate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: targetStage }),
      });
    } catch (err) {
      console.error('Error updating candidate stage:', err);
    }

    setDragOverStage(null);
    setDraggedCandidate(null);
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getFitScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#3B82F6'; // Blue
    if (score >= 70) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const renderCandidateCard = (candidate) => (
    <div
      key={candidate.id}
      className="candidate-card"
      draggable
      onDragStart={(e) => handleDragStart(e, candidate)}
      onDragEnd={handleDragEnd}
    >
      <div className="candidate-header">
        <div 
          className="candidate-avatar" 
          style={{ backgroundColor: getAvatarColor(candidate.name) }}
        >
          {candidate.avatar}
        </div>
        <div className="candidate-info">
          <h4>{candidate.name}</h4>
          <p className="candidate-email">{candidate.email}</p>
        </div>
      </div>
      
      <div className="candidate-position">
        <span className="position-icon">💼</span>
        <span>{candidate.position}</span>
      </div>
      
      <div className="candidate-fit-score">
        <div className="fit-score-label">
          <span>Fit Score</span>
          <span className="fit-score-value">{candidate.fitScore}%</span>
        </div>
        <div className="fit-score-bar">
          <div 
            className="fit-score-fill" 
            style={{ 
              width: `${candidate.fitScore}%`,
              backgroundColor: getFitScoreColor(candidate.fitScore)
            }}
          ></div>
        </div>
      </div>
      
      <div className="candidate-date">
        <span className="date-icon">📅</span>
        <span>{candidate.date}</span>
      </div>
      
      <div className="candidate-footer">
        <p className="drag-hint">Drag to move or use buttons</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="candidate-pipeline">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidate pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-pipeline">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchCandidates} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-pipeline">
      <div className="pipeline-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <span>←</span> Back
        </button>
        
        <div className="pipeline-title">
          <div className="title-icon">📊</div>
          <div>
            <h1>Candidate Pipeline</h1>
            <p>Drag & drop to move candidates through stages</p>
          </div>
        </div>
        
        <div className="pipeline-stats">
          <div className="stat-item">
            <span className="stat-label">Total Candidates</span>
            <span className="stat-value">{stats.totalCandidates}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Pipeline</span>
            <span className="stat-value">{stats.activePipeline}</span>
          </div>
        </div>
      </div>

      <div className="pipeline-stages">
        {stageConfig.map((stage) => (
          <div
            key={stage.name}
            className={`pipeline-stage ${dragOverStage === stage.name ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(stage.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            <div className="stage-header">
              <div className="stage-title">
                <span className="stage-icon">{stage.icon}</span>
                <span className="stage-name">{stage.name}</span>
              </div>
              <div 
                className="stage-count" 
                style={{ backgroundColor: stage.color }}
              >
                {pipeline[stage.name].length}
              </div>
            </div>
            
            <div className="stage-cards">
              {pipeline[stage.name].length === 0 ? (
                <div className="empty-stage">
                  <p>No candidates in this stage</p>
                </div>
              ) : (
                pipeline[stage.name].map(renderCandidateCard)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pipeline-instructions">
        <div className="instruction-icon">ℹ️</div>
        <div className="instruction-content">
          <h3>How to use the Pipeline</h3>
          <ul>
            <li><strong>Drag & Drop:</strong> Click and drag candidate cards to move them between stages</li>
            <li><strong>Confirmation:</strong> You'll be asked to confirm before moving a candidate</li>
            <li><strong>Visual Feedback:</strong> Columns highlight when you hover over them while dragging</li>
            <li><strong>Fit Score:</strong> Color-coded scores help identify top candidates (Green: 90+, Blue: 80+, Orange: 40+)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CandidatePipeline;
