import React, { useState, useEffect } from 'react';
import './ResumeScreening.css';

const ResumeScreening = ({ onBack }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/resume-screening/jobs?what=nodejs&where=Hyderabad');
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        if (data.jobs.length > 0) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load job positions');
    }
  };

  const handleJobSelect = (e) => {
    const jobId = e.target.value;
    const job = jobs.find(j => j.id === jobId);
    setSelectedJob(job);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError(null);
    } else {
      setError('Please upload a PDF file only');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError(null);
    } else {
      setError('Please upload a PDF file only');
    }
  };

  const handleScreenResume = async () => {
    if (!resumeFile || !selectedJob) {
      setError('Please select a job position and upload a resume');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobTitle', selectedJob.title);
    formData.append('requiredSkills', JSON.stringify(selectedJob.requiredSkills || []));
    formData.append('candidateName', candidateInfo.name);
    formData.append('email', candidateInfo.email);
    formData.append('phone', candidateInfo.phone);

    try {
      const response = await fetch('/api/resume-screening/screen', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setScreeningResult(data.result);
        // Update candidate info from extraction if not provided
        if (!candidateInfo.name && data.result.extraction) {
          setCandidateInfo({
            name: data.result.extraction.name || '',
            email: data.result.extraction.email || candidateInfo.email,
            phone: data.result.extraction.phone || candidateInfo.phone
          });
        }
      } else {
        setError(data.message || 'Failed to screen resume');
      }
    } catch (error) {
      console.error('Error screening resume:', error);
      setError('Failed to screen resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (screeningResult) {
    return (
      <div className="resume-screening-container">
        <div className="screening-header">
          <button className="back-button" onClick={() => setScreeningResult(null)}>
            <span className="arrow">←</span> Back to Upload
          </button>
          <div className="header-content">
            <div className="header-text">
              <h1>AI Resume Screening Results</h1>
              <p>Powered by Advanced AI Intelligence</p>
            </div>
          </div>
        </div>

        <div className="results-container">
          <div className="result-card score-card">
            <h2>Match Score</h2>
            <div className="score-display">
              <div className="score-circle" style={{
                background: `conic-gradient(#4CAF50 ${screeningResult.matchScore * 3.6}deg, #f0f0f0 0deg)`
              }}>
                <span className="score-value">{screeningResult.matchScore}%</span>
              </div>
              <p className="score-status">{screeningResult.status}</p>
            </div>
          </div>

          <div className="result-card extraction-card">
            <h2>🔍 Smart Extraction</h2>
            <div className="extraction-details">
              <p><strong>Name:</strong> {screeningResult.extraction.name}</p>
              <p><strong>Email:</strong> {screeningResult.extraction.email}</p>
              <p><strong>Phone:</strong> {screeningResult.extraction.phone}</p>
              <p><strong>Experience:</strong> {screeningResult.extraction.experience}</p>
              <p><strong>Education:</strong> {screeningResult.extraction.education}</p>
              <div className="skills-extracted">
                <strong>Skills:</strong>
                <div className="skill-tags">
                  {screeningResult.extraction.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="result-card analysis-card">
            <h2>📊 Detailed Analysis</h2>
            <div className="analysis-section">
              <h3>Strengths</h3>
              <ul>
                {screeningResult.analysis.strengths.map((strength, idx) => (
                  <li key={idx}>✓ {strength}</li>
                ))}
              </ul>
            </div>
            <div className="analysis-section">
              <h3>Areas of Concern</h3>
              <ul>
                {screeningResult.analysis.concerns.map((concern, idx) => (
                  <li key={idx}>⚠ {concern}</li>
                ))}
              </ul>
            </div>
            <div className="analysis-section">
              <h3>Skill Match</h3>
              <div className="skill-match-list">
                {screeningResult.analysis.skillMatch.map((item, idx) => (
                  <div key={idx} className="skill-match-item">
                    <span className={`match-indicator ${item.matched ? 'matched' : 'not-matched'}`}>
                      {item.matched ? '✓' : '✗'}
                    </span>
                    <span className="skill-name">{item.skill}</span>
                    {item.matched && <span className="proficiency">{item.proficiency}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="result-card recommendations-card">
            <h2>💡 Recommendations</h2>
            <ul>
              {screeningResult.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-screening-container">
      <div className="screening-header">
        <button className="back-button" onClick={onBack}>
          <span className="arrow">←</span> Back to Dashboard
        </button>
        <div className="header-content">
          <div className="header-text">
            <h1>AI Resume Screening</h1>
            <p>Powered by Advanced AI Intelligence</p>
          </div>
        </div>
      </div>

      <div className="screening-content">
        <div className="left-section">
          <div className="section-card">
            <div className="section-header">
              <div>
                <h2>Select Position</h2>
                <p>Choose the job role for screening</p>
              </div>
              <div className="section-icon target-icon">🎯</div>
            </div>
            
            <div className="form-group">
              <label htmlFor="jobPosition">Job Position</label>
              <select 
                id="jobPosition" 
                value={selectedJob?.id || ''} 
                onChange={handleJobSelect}
                className="job-select"
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedJob && selectedJob.requiredSkills.length > 0 && (
              <div className="skills-section">
                <label>Required Skills:</label>
                <div className="skills-badges">
                  {selectedJob.requiredSkills.map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="section-card">
            <div className="section-header">
              <div>
                <h2>Upload Resume</h2>
                <p>Drag & drop or browse to upload</p>
              </div>
              <div className="section-icon upload-icon">📤</div>
            </div>

            <div 
              className={`upload-area ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                type="file"
                id="fileInput"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {resumeFile ? (
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <p className="file-name">{resumeFile.name}</p>
                  <p className="file-size">{(resumeFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon-large">⬆️</div>
                  <p className="upload-text">Drag & drop resume here</p>
                  <p className="upload-subtext">or click to browse</p>
                  <p className="upload-hint">PDF only</p>
                </>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="section-card">
            <div className="section-header">
              <div>
                <h2>Candidate Information (Optional)</h2>
                <p>AI will extract this from resume if not provided</p>
              </div>
              <div className="section-icon">👤</div>
            </div>

            <div className="form-group">
              <label htmlFor="candidateName">Name</label>
              <input
                type="text"
                id="candidateName"
                value={candidateInfo.name}
                onChange={(e) => setCandidateInfo({...candidateInfo, name: e.target.value})}
                placeholder="Candidate name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="candidateEmail">Email</label>
              <input
                type="email"
                id="candidateEmail"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo({...candidateInfo, email: e.target.value})}
                placeholder="candidate@email.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="candidatePhone">Phone</label>
              <input
                type="tel"
                id="candidatePhone"
                value={candidateInfo.phone}
                onChange={(e) => setCandidateInfo({...candidateInfo, phone: e.target.value})}
                placeholder="+91 9876543210"
                className="form-input"
              />
            </div>
          </div>

          <button 
            className="screen-button" 
            onClick={handleScreenResume}
            disabled={!resumeFile || !selectedJob || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Screening...
              </>
            ) : (
              <>
                <span className="sparkle-icon">✨</span> Screen Resume with AI
              </>
            )}
          </button>
        </div>

        <div className="right-section">
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h2>Ready to Screen</h2>
            <p>Select a job position and upload a resume to begin AI-powered screening</p>

            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <h3>Smart Extraction</h3>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <h3>AI Matching</h3>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <h3>Instant Results</h3>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <div>
                  <h3>Detailed Analysis</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeScreening;
