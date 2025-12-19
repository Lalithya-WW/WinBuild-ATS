import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import * as api from '../services/api';
import './CandidatesList.css';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await api.deleteCandidate(id);
        fetchCandidates();
      } catch (error) {
        console.error('Error deleting candidate:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading candidates...</div>;
  }

  return (
    <div className="candidates-list">
      <div className="section-header">
        <h2 className="section-title">Candidates</h2>
        <p className="section-subtitle">Manage candidate applications</p>
      </div>

      <div className="candidates-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Position</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td>
                  <div className="candidate-name">
                    <Users size={18} />
                    {candidate.name}
                  </div>
                </td>
                <td>
                  <div className="candidate-email">
                    <Mail size={16} />
                    {candidate.email || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="candidate-phone">
                    <Phone size={16} />
                    {candidate.phone || 'N/A'}
                  </div>
                </td>
                <td>{candidate.position}</td>
                <td>
                  <span className={`status-badge ${candidate.status}`}>
                    {candidate.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-edit">
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon btn-delete" 
                      onClick={() => handleDelete(candidate.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesList;
