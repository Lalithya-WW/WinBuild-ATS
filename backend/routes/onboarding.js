const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

console.log('Onboarding routes loaded');

// Test endpoint
router.get('/api/onboarding/test', (req, res) => {
  res.json({ success: true, message: 'Onboarding routes are working!' });
});

// Get candidate data for onboarding handoff
router.get('/api/onboarding/:candidateId', async (req, res) => {
  console.log('Onboarding GET request received for candidate:', req.params.candidateId);
  try {
    const { candidateId } = req.params;
    const pool = await getConnection();
    
    // Get candidate information (simplified query - only from Candidates table)
    const query = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.position,
        c.status,
        c.createdAt
      FROM Candidates c
      WHERE c.id = @candidateId
    `;
    
    const candidateResult = await pool.request()
      .input('candidateId', sql.Int, candidateId)
      .query(query);
    
    if (candidateResult.recordset.length === 0) {
      // Return mock data if candidate not found
      console.log('Candidate not found in database, returning mock data');
      return res.json({
        success: true,
        candidate: {
          id: parseInt(candidateId),
          name: 'Sarah Johnson',
          email: 'sarah@email.com',
          phone: '+1 (234) 567-8901',
          position: 'Senior Software Engineer',
          status: 'active',
          createdAt: new Date(),
          baseSalary: 120000,
          signingBonus: 10000,
          equityShares: 5000,
          vacationDays: 20,
          healthBenefits: 'Premium Coverage',
          workArrangement: 'Hybrid (3 days/week)',
          startDate: new Date('2026-01-15'),
          offerStatus: 'accepted',
          offerAcceptedDate: new Date('2025-12-18'),
          fitScore: 92,
          location: 'San Francisco, CA',
          department: 'Engineering',
          reportingManager: 'John Smith',
          journey: [
            {
              title: 'Application Received',
              date: new Date('2025-11-20'),
              status: 'completed'
            },
            {
              title: 'AI Resume Screening',
              date: new Date('2025-11-20'),
              status: 'completed'
            },
            {
              title: 'Interviews Completed',
              count: 2,
              date: new Date('2025-12-05'),
              status: 'completed'
            },
            {
              title: 'Offer Extended',
              date: new Date('2025-12-15'),
              status: 'completed'
            },
            {
              title: 'Offer Accepted',
              date: new Date('2025-12-18'),
              status: 'completed'
            }
          ]
        }
      });
    }
    
    const candidate = candidateResult.recordset[0];
    
    // Add mock offer data (since we're not querying the Offers table)
    candidate.baseSalary = 120000;
    candidate.signingBonus = 10000;
    candidate.equityShares = 5000;
    candidate.vacationDays = 20;
    candidate.healthBenefits = 'Premium Coverage';
    candidate.workArrangement = 'Hybrid (3 days/week)';
    candidate.startDate = new Date('2026-01-15');
    candidate.offerStatus = 'accepted';
    candidate.offerAcceptedDate = new Date();
    candidate.fitScore = 92;
    candidate.location = 'San Francisco, CA';
    candidate.department = 'Engineering';
    candidate.reportingManager = 'John Smith';
    
    // Get interview history
    let interviews = { interviewCount: 0, lastInterviewDate: null };
    try {
      const interviewsResult = await pool.request()
        .input('candidateId', sql.Int, candidateId)
        .query(`
          SELECT 
            COUNT(*) as interviewCount,
            MAX(scheduleDate) as lastInterviewDate
          FROM Interviews
          WHERE candidateId = @candidateId
        `);
      interviews = interviewsResult.recordset[0];
    } catch (err) {
      console.log('Error fetching interviews:', err.message);
    }
    
    // Build recruitment journey
    const journey = [
      {
        title: 'Application Received',
        date: candidate.createdAt,
        status: 'completed'
      },
      {
        title: 'AI Resume Screening',
        date: candidate.createdAt,
        status: 'completed'
      },
      {
        title: 'Interviews Completed',
        count: interviews.interviewCount || 0,
        date: interviews.lastInterviewDate || candidate.createdAt,
        status: 'completed'
      },
      {
        title: 'Offer Extended',
        date: candidate.offerAcceptedDate || candidate.createdAt,
        status: 'completed'
      },
      {
        title: 'Offer Accepted',
        date: candidate.offerAcceptedDate || candidate.createdAt,
        status: 'completed'
      }
    ];
    
    // Prepare response data
    const responseData = {
      ...candidate,
      fitScore: 92, // Default fit score, can be calculated based on actual data
      location: 'San Francisco, CA', // Default location
      department: 'Engineering', // Can be extracted from job posting
      reportingManager: 'John Smith', // Can be extracted from offer or job
      journey: journey
    };
    
    res.json({
      success: true,
      candidate: responseData
    });
    
  } catch (error) {
    console.error('Error fetching candidate for onboarding:', error);
    res.status(200).json({
      success: false,
      message: `Failed to fetch candidate data: ${error.message}`,
      error: error.message,
      details: 'Please ensure the database is connected and the Candidates table exists'
    });
  }
});

// Send candidate to onboarding
router.post('/api/onboarding/:candidateId/send', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const pool = await getConnection();
    
    // Update candidate status to 'onboarding'
    await pool.request()
      .input('candidateId', sql.Int, candidateId)
      .query(`
        UPDATE Candidates
        SET status = 'onboarding', updatedAt = GETDATE()
        WHERE id = @candidateId
      `);
    
    // Log activity
    await pool.request()
      .input('type', sql.NVarChar, 'onboarding')
      .input('title', sql.NVarChar, 'Sent to Onboarding')
      .input('description', sql.NVarChar, `Candidate transferred to onboarding team`)
      .input('relatedId', sql.Int, candidateId)
      .query(`
        INSERT INTO Activities (type, title, description, relatedId, timestamp)
        VALUES (@type, @title, @description, @relatedId, GETDATE())
      `);
    
    res.json({
      success: true,
      message: 'Candidate successfully sent to onboarding team'
    });
    
  } catch (error) {
    console.error('Error sending candidate to onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send candidate to onboarding',
      error: error.message
    });
  }
});

// Get all candidates ready for onboarding
router.get('/api/onboarding/ready', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.position,
          o.startDate,
          o.acceptedDate as offerAcceptedDate
        FROM Candidates c
        INNER JOIN Offers o ON c.id = o.candidateId
        WHERE o.status = 'accepted' AND c.status != 'onboarding'
        ORDER BY o.acceptedDate DESC
      `);
    
    res.json({
      success: true,
      candidates: result.recordset
    });
    
  } catch (error) {
    console.error('Error fetching candidates ready for onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message
    });
  }
});

module.exports = router;
