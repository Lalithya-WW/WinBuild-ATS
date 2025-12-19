import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Calendar, Trash2, Edit } from 'lucide-react';
import * as api from '../services/api';
import './JobsList.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await api.deleteJob(id);
        fetchJobs();
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="jobs-list">
      <div className="section-header">
        <h2 className="section-title">Open Jobs</h2>
        <p className="section-subtitle">Manage job postings</p>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <div className="job-icon">
                <Briefcase size={20} />
              </div>
              <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            
            <h3 className="job-title">{job.title}</h3>
            
            <div className="job-details">
              <div className="job-detail">
                <MapPin size={16} />
                <span>{job.location}</span>
              </div>
              <div className="job-detail">
                <Briefcase size={16} />
                <span>{job.department}</span>
              </div>
              <div className="job-detail">
                <Calendar size={16} />
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="job-actions">
              <button className="btn-edit">
                <Edit size={16} />
                Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(job.id)}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsList;
