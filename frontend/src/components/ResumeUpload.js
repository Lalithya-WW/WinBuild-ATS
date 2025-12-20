import React, { useState } from 'react';
import './ResumeUpload.css';

const ResumeUpload = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    phone: '',
    position: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
        setFile(null);
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('Please select a resume file');
      return;
    }

    if (!formData.candidateName || !formData.position) {
      setError('Candidate name and position are required');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('resume', file);
    uploadFormData.append('candidateName', formData.candidateName);
    uploadFormData.append('email', formData.email);
    uploadFormData.append('phone', formData.phone);
    uploadFormData.append('position', formData.position);

    setUploading(true);

    try {
      const response = await fetch('http://localhost:5000/api/resumes/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Resume uploaded successfully!');
      setFormData({
        candidateName: '',
        email: '',
        phone: '',
        position: ''
      });
      setFile(null);
      
      // Reset file input
      document.getElementById('resume-file').value = '';

      if (onUploadSuccess) {
        onUploadSuccess(data.candidate);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <h2>Upload Resume</h2>
      
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="resume-upload-form">
        <div className="form-group">
          <label htmlFor="candidateName">Candidate Name *</label>
          <input
            type="text"
            id="candidateName"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            required
            placeholder="Enter candidate name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="candidate@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="555-0123"
          />
        </div>

        <div className="form-group">
          <label htmlFor="position">Position *</label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            required
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resume-file">Resume File * (PDF, DOC, DOCX - Max 10MB)</label>
          <input
            type="file"
            id="resume-file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            required
          />
          {file && (
            <div className="file-info">
              <span className="file-name">📄 {file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={uploading}>
          {uploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
            </>
          ) : (
            'Upload Resume'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResumeUpload;
