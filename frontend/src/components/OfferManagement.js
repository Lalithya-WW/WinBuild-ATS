import React, { useState, useEffect } from 'react';
import './OfferManagement.css';
import api from '../services/api';

const OfferManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [candidates, setCandidates] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [startDate, setStartDate] = useState('2026-01-15');
  const [baseSalary, setBaseSalary] = useState('120000');
  const [signingBonus, setSigningBonus] = useState('10000');
  const [equityShares, setEquityShares] = useState('5000');
  const [vacationDays, setVacationDays] = useState('20');
  const [healthBenefits, setHealthBenefits] = useState('Premium Coverage');
  const [workArrangement, setWorkArrangement] = useState('Hybrid (3 days/week)');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Calculate total cash compensation
  const totalCash = parseFloat(baseSalary || 0) + parseFloat(signingBonus || 0);

  useEffect(() => {
    fetchCandidates();
    fetchOffers();
  }, []);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCandidatesForOffers();
      if (response.success) {
        setCandidates(response.candidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await api.getOffers();
      if (response.success) {
        setOffers(response.offers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateName(candidate.name);
    setCandidateEmail(candidate.email || '');
    setJobTitle(candidate.position || '');
    setView('create');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedCandidate(null);
    resetForm();
  };

  const resetForm = () => {
    setCandidateName('');
    setCandidateEmail('');
    setJobTitle('');
    setStartDate('2026-01-15');
    setBaseSalary('120000');
    setSigningBonus('10000');
    setEquityShares('5000');
    setVacationDays('20');
    setHealthBenefits('Premium Coverage');
    setWorkArrangement('Hybrid (3 days/week)');
    setMessage('');
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      const offerData = {
        candidateId: selectedCandidate?.id || null,
        candidateName,
        jobTitle,
        startDate,
        baseSalary: parseFloat(baseSalary),
        signingBonus: parseFloat(signingBonus),
        equityShares: parseFloat(equityShares),
        vacationDays: parseInt(vacationDays),
        healthBenefits,
        workArrangement,
        status: 'draft'
      };

      const response = await api.createOffer(offerData);
      
      if (response.success) {
        setMessage('✓ Offer saved as draft successfully!');
        setTimeout(() => {
          setMessage('');
          handleBackToList();
          fetchOffers();
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setMessage('✗ Failed to save draft');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAndSend = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      // First create the offer
      const offerData = {
        candidateId: selectedCandidate?.id || null,
        candidateName,
        jobTitle,
        startDate,
        baseSalary: parseFloat(baseSalary),
        signingBonus: parseFloat(signingBonus),
        equityShares: parseFloat(equityShares),
        vacationDays: parseInt(vacationDays),
        healthBenefits,
        workArrangement,
        status: 'draft'
      };

      const createResponse = await api.createOffer(offerData);
      
      if (createResponse.success) {
        const offerId = createResponse.offer.id;
        
        // Then approve it
        const approveResponse = await api.approveOffer(offerId);
        
        if (approveResponse.success) {
          setMessage('✓ Offer approved and sent successfully!');
          setTimeout(() => {
            setMessage('');
            handleBackToList();
            fetchOffers();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error approving offer:', error);
      setMessage('✗ Failed to approve and send offer');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'status-draft', text: 'Draft' },
      approved: { class: 'status-approved', text: 'Approved' },
      sent: { class: 'status-sent', text: 'Sent' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      rejected: { class: 'status-rejected', text: 'Rejected' }
    };
    const badge = badges[status] || { class: 'status-draft', text: status };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (view === 'list') {
    return (
      <div className="offer-management">
        <div className="offer-header">
          <div className="header-left">
            <button className="back-button" onClick={() => window.history.back()}>
              ← Back
            </button>
            <div className="header-info">
              <div className="header-icon">B</div>
              <div className="header-text">
                <h1>Offer Management</h1>
                <p>Manage and create employment offers</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <span className="user-badge">VL</span>
          </div>
        </div>

        <div className="list-container">
          <div className="list-section">
            <div className="section-header">
              <h2>📋 Candidates ({candidates.length})</h2>
              <p>Select a candidate to create an offer</p>
            </div>
            
            {isLoading ? (
              <div className="loading-state">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="empty-state">No candidates available</div>
            ) : (
              <div className="candidates-grid">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="candidate-card">
                    <div className="candidate-avatar">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="candidate-info">
                      <h3>{candidate.name}</h3>
                      <p className="candidate-position">{candidate.position}</p>
                      <p className="candidate-email">{candidate.email}</p>
                      <p className="candidate-date">Applied: {formatDate(candidate.createdAt)}</p>
                    </div>
                    <button 
                      className="create-offer-btn"
                      onClick={() => handleSelectCandidate(candidate)}
                    >
                      Create Offer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="list-section">
            <div className="section-header">
              <h2>📄 Recent Offers ({offers.length})</h2>
              <p>View and manage all offers</p>
            </div>
            
            {offers.length === 0 ? (
              <div className="empty-state">No offers created yet</div>
            ) : (
              <div className="offers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Position</th>
                      <th>Total Cash</th>
                      <th>Start Date</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id}>
                        <td><strong>{offer.candidateName}</strong></td>
                        <td>{offer.jobTitle}</td>
                        <td className="amount">{formatCurrency(offer.totalCash || offer.baseSalary)}</td>
                        <td>{formatDate(offer.startDate)}</td>
                        <td>{getStatusBadge(offer.status)}</td>
                        <td>{formatDate(offer.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="offer-management">
      <div className="offer-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to List
          </button>
          <div className="header-info">
            <div className="header-icon">B</div>
            <div className="header-text">
              <h1>Create Offer</h1>
              <p>Generate employment offer for {candidateName || 'candidate'}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <span className="user-badge">VL</span>
          <button className="draft-button" onClick={handleSaveDraft} disabled={isLoading}>
            Save Draft
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="offer-content">
        <div className="left-panel">
          <div className="section candidate-info">
            <h2>Candidate Information</h2>
            <p className="section-description">Basic details about the offer recipient</p>
            
            <div className="form-group">
              <label>Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
              />
            </div>

            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter job title"
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="section compensation">
            <h2>💰 Compensation Package</h2>
            <p className="section-description">Financial components of the offer</p>
            
            <div className="form-group">
              <label>Base Salary (Annual)</label>
              <div className="input-with-icon">
                <span className="currency-icon">$</span>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="120000"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Signing Bonus</label>
              <div className="input-with-icon">
                <span className="currency-icon">$</span>
                <input
                  type="number"
                  value={signingBonus}
                  onChange={(e) => setSigningBonus(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Equity (RSU Shares)</label>
              <div className="input-with-icon">
                <span className="currency-icon">📈</span>
                <input
                  type="number"
                  value={equityShares}
                  onChange={(e) => setEquityShares(e.target.value)}
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="total-compensation">
              <span>Total Cash Compensation</span>
              <span className="total-amount">{formatCurrency(totalCash)}</span>
            </div>
          </div>

          <div className="section benefits">
            <h2>Benefits & Perks</h2>
            <p className="section-description">Additional benefits included in the offer</p>
            
            <div className="form-group">
              <label>Vacation Days (Annual)</label>
              <div className="input-with-icon">
                <span className="currency-icon">🏖️</span>
                <input
                  type="number"
                  value={vacationDays}
                  onChange={(e) => setVacationDays(e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Health Benefits</label>
              <select
                value={healthBenefits}
                onChange={(e) => setHealthBenefits(e.target.value)}
              >
                <option value="Premium Coverage">Premium Coverage</option>
                <option value="Standard Coverage">Standard Coverage</option>
                <option value="Basic Coverage">Basic Coverage</option>
              </select>
            </div>

            <div className="form-group">
              <label>Work Arrangement</label>
              <select
                value={workArrangement}
                onChange={(e) => setWorkArrangement(e.target.value)}
              >
                <option value="Hybrid (3 days/week)">Hybrid (3 days/week)</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="offer-preview">
            <div className="preview-header">
              <h2>📄 Offer Letter Preview</h2>
              <p>Read-only preview of the offer document</p>
            </div>

            <div className="preview-content">
              <div className="preview-greeting">
                <p>Dear {candidateName},</p>
              </div>

              <div className="preview-intro">
                <p>
                  We are delighted to extend this offer for the position of <strong>{jobTitle}</strong>. 
                  We believe you would be a valuable addition to our team.
                </p>
              </div>

              <div className="preview-section">
                <h3>Compensation Package:</h3>
                <div className="preview-item">
                  <span className="preview-icon">💵</span>
                  <span className="preview-label">Base Salary:</span>
                  <span className="preview-value">{formatCurrency(parseFloat(baseSalary || 0))}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-icon">💰</span>
                  <span className="preview-label">Signing Bonus:</span>
                  <span className="preview-value">{formatCurrency(parseFloat(signingBonus || 0))}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-icon">📈</span>
                  <span className="preview-label">Equity Shares:</span>
                  <span className="preview-value">{equityShares} RSUs</span>
                </div>
                <div className="preview-total">
                  <span className="preview-label">Total Cash:</span>
                  <span className="preview-value total">{formatCurrency(totalCash)}</span>
                </div>
              </div>

              <div className="preview-section">
                <h3>Benefits & Perks:</h3>
                <div className="preview-benefit">
                  <span className="benefit-icon">✓</span>
                  <span className="benefit-text">Premium health coverage</span>
                </div>
                <div className="preview-benefit">
                  <span className="benefit-icon">✓</span>
                  <span className="benefit-text">{vacationDays} vacation days per year</span>
                </div>
                <div className="preview-benefit">
                  <span className="benefit-icon">✓</span>
                  <span className="benefit-text">{workArrangement} work arrangement</span>
                </div>
                <div className="preview-benefit">
                  <span className="benefit-icon">✓</span>
                  <span className="benefit-text">401(k) matching and professional development budget</span>
                </div>
              </div>

              <div className="preview-start-date">
                <p>
                  <strong>Start Date:</strong> Your anticipated start date is{' '}
                  <strong>{new Date(startDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong>.
                </p>
              </div>

              <div className="preview-footer">
                <p>
                  This offer is contingent upon successful completion of background checks
                  and reference verification. Please sign and return this letter by [deadline] to
                  accept this offer.
                </p>
                <p>
                  We are excited about the possibility of you joining our team and look forward
                  to your positive response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="offer-actions">
        <button 
          className="approve-button" 
          onClick={handleApproveAndSend}
          disabled={isLoading}
        >
          <span className="button-icon">✉</span>
          Approve & Send Offer
        </button>
      </div>
    </div>
  );
};

export default OfferManagement;
