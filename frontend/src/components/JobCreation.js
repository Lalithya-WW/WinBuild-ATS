import React, { useState } from 'react';
import './JobCreation.css';

const JobCreation = ({ onBack }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    location: '',
    employmentType: '',
    jobDescription: '',
    requiredSkills: [],
    experienceRange: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});

  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Customer Success'
  ];

  const locations = [
    'Remote',
    'Hyderabad, India',
    'Bangalore, India',
    'Mumbai, India',
    'Delhi, India',
    'Pune, India',
    'Chennai, India',
    'New York, USA',
    'San Francisco, USA',
    'London, UK',
    'Singapore'
  ];

  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary'
  ];

  const experienceRanges = [
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5-7 years',
    '7-10 years',
    '10+ years'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, skillInput.trim()]
      });
      setSkillInput('');
      if (errors.requiredSkills) {
        setErrors({ ...errors, requiredSkills: '' });
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (!formData.employmentType) {
      newErrors.employmentType = 'Employment type is required';
    }

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    } else if (formData.jobDescription.trim().length < 50) {
      newErrors.jobDescription = 'Job description must be at least 50 characters';
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.requiredSkills = 'At least one skill is required';
    }

    if (!formData.experienceRange) {
      newErrors.experienceRange = 'Experience range is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields correctly' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5000/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Job created successfully!' });
        // Reset form after success
        setTimeout(() => {
          setFormData({
            jobTitle: '',
            department: '',
            location: '',
            employmentType: '',
            jobDescription: '',
            requiredSkills: [],
            experienceRange: ''
          });
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create job' });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating the job' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      jobTitle: '',
      department: '',
      location: '',
      employmentType: '',
      jobDescription: '',
      requiredSkills: [],
      experienceRange: ''
    });
    setErrors({});
    setMessage({ type: '', text: '' });
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="job-creation-container">
      <div className="job-creation-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
        <h1>Create New Job</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="job-creation-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">💼</div>
            <div>
              <h2>Basic Information</h2>
              <p>Define the core details of the job posting</p>
            </div>
          </div>

          <div className="form-group">
            <label>
              Job Title <span className="required">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              placeholder="e.g., Senior Software Engineer"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className={errors.jobTitle ? 'error' : ''}
            />
            {errors.jobTitle && <span className="error-message">{errors.jobTitle}</span>}
          </div>

          <div className="form-group">
            <label>
              Department <span className="required">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className={errors.department ? 'error' : ''}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <span className="error-message">{errors.department}</span>}
          </div>

          <div className="form-group">
            <label>
              Location <span className="required">*</span>
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={errors.location ? 'error' : ''}
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label>
              Employment Type <span className="required">*</span>
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className={errors.employmentType ? 'error' : ''}
            >
              <option value="">Select employment type</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.employmentType && <span className="error-message">{errors.employmentType}</span>}
          </div>

          <div className="form-group">
            <label>
              Job Description <span className="required">*</span>
            </label>
            <textarea
              name="jobDescription"
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              value={formData.jobDescription}
              onChange={handleInputChange}
              rows="6"
              className={errors.jobDescription ? 'error' : ''}
            />
            <div className="char-count">
              {formData.jobDescription.length} characters (minimum 50)
            </div>
            {errors.jobDescription && <span className="error-message">{errors.jobDescription}</span>}
          </div>
        </div>

        {/* Requirements Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">🎯</div>
            <div>
              <h2>Requirements</h2>
              <p>Specify the skills and experience needed</p>
            </div>
          </div>

          <div className="form-group">
            <label>
              Required Skills <span className="required">*</span>
            </label>
            <div className="skills-input-wrapper">
              <input
                type="text"
                placeholder="Type a skill and press Enter or click Add"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className={errors.requiredSkills ? 'error' : ''}
              />
              <button
                type="button"
                className="add-skill-button"
                onClick={handleAddSkill}
                disabled={!skillInput.trim()}
              >
                + Add
              </button>
            </div>
            {errors.requiredSkills && <span className="error-message">{errors.requiredSkills}</span>}
            
            {formData.requiredSkills.length > 0 && (
              <div className="skills-list">
                {formData.requiredSkills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="remove-skill"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              Experience Range <span className="required">*</span>
            </label>
            <select
              name="experienceRange"
              value={formData.experienceRange}
              onChange={handleInputChange}
              className={errors.experienceRange ? 'error' : ''}
            >
              <option value="">Select experience range</option>
              {experienceRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            {errors.experienceRange && <span className="error-message">{errors.experienceRange}</span>}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Job...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobCreation;
