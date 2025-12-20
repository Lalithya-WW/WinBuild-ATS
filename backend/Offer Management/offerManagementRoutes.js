const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getConnection, sql } = require('../config/database');

// In-memory storage for offers (fallback if database is not available)
let offers = [];
let offerIdCounter = 1;

// Adzuna API configuration
const ADZUNA_APP_ID = '17d79c26';
const ADZUNA_APP_KEY = 'eda0bf8d8c2f0f2581b576d038ec09c1';
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';

// No need to initialize - using existing Offers table from database

// Get all candidates from database
router.get('/api/candidates', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        id,
        name,
        email,
        phone,
        position,
        status,
        createdAt
      FROM Candidates
      WHERE status = 'active'
      ORDER BY createdAt DESC
    `);
    
    res.json({
      success: true,
      candidates: result.recordset
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message
    });
  }
});

// Get job listings from Adzuna API
router.get('/api/jobs', async (req, res) => {
  try {
    const { what = 'nodejs', where = 'Hyderabad', page = 1 } = req.query;
    const url = `${ADZUNA_BASE_URL}/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${what}&where=${where}`;
    
    const response = await axios.get(url);
    
    // Transform Adzuna data to our format
    const jobs = response.data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      created: job.created,
      url: job.redirect_url
    }));
    
    res.json({
      success: true,
      count: response.data.count,
      jobs: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs from Adzuna:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job listings',
      error: error.message
    });
  }
});

// Get all offers
router.get('/api/offers', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        o.OfferId as id,
        o.ApplicationId,
        o.Salary,
        o.StartDate,
        o.OfferLetter,
        o.Status,
        o.SentDate,
        o.ResponseDate,
        o.ExpiryDate,
        o.Notes,
        o.CreatedBy,
        o.CreatedAt as createdAt,
        o.UpdatedAt as updatedAt,
        c.name as candidateName,
        c.position as jobTitle,
        o.Salary as totalCash
      FROM [dbo].[Offers] o
      LEFT JOIN [dbo].[Candidates] c ON o.ApplicationId = c.id
      ORDER BY o.CreatedAt DESC
    `);
    
    res.json({
      success: true,
      offers: result.recordset
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message
    });
  }
});

// Get a specific offer by ID
router.get('/api/offers/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT 
          o.*,
          c.name as candidateName,
          c.position as jobTitle
        FROM [dbo].[Offers] o
        LEFT JOIN [dbo].[Candidates] c ON o.ApplicationId = c.id
        WHERE o.OfferId = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      offer: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer',
      error: error.message
    });
  }
});

// Create a new offer
router.post('/api/offers', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      jobTitle,
      startDate,
      baseSalary,
      signingBonus,
      equityShares,
      vacationDays,
      healthBenefits,
      workArrangement,
      status = 'Draft'
    } = req.body;
    
    // Validation
    if (!candidateId || !baseSalary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateId, baseSalary'
      });
    }
    
    const totalSalary = parseFloat(baseSalary || 0) + parseFloat(signingBonus || 0);
    
    // Build offer letter text
    const offerLetter = `Dear ${candidateName},

We are delighted to offer you the position of ${jobTitle}.

Compensation Package:
- Base Salary: $${parseFloat(baseSalary).toLocaleString()}
- Signing Bonus: $${parseFloat(signingBonus || 0).toLocaleString()}
- Equity Shares: ${equityShares || 0} RSUs
- Total Cash: $${totalSalary.toLocaleString()}

Benefits & Perks:
- ${vacationDays || 20} vacation days per year
- ${healthBenefits || 'Premium Coverage'}
- ${workArrangement || 'Hybrid'} work arrangement
- 401(k) matching and professional development budget

Start Date: ${startDate ? new Date(startDate).toLocaleDateString() : 'TBD'}

We look forward to welcoming you to our team!`;

    const pool = await getConnection();
    const result = await pool.request()
      .input('applicationId', sql.Int, candidateId)
      .input('salary', sql.Decimal(18, 2), totalSalary)
      .input('startDate', sql.Date, startDate || null)
      .input('offerLetter', sql.NVarChar, offerLetter)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, `Base: $${baseSalary}, Bonus: $${signingBonus || 0}, Equity: ${equityShares || 0} RSUs`)
      .input('createdBy', sql.Int, 1)
      .query(`
        INSERT INTO [dbo].[Offers] (
          ApplicationId, Salary, StartDate, OfferLetter, Status, Notes, CreatedBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @applicationId, @salary, @startDate, @offerLetter, @status, @notes, @createdBy
        )
      `);
    
    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer: {
        ...result.recordset[0],
        candidateName,
        jobTitle,
        totalCash: totalSalary
      }
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create offer',
      error: error.message
    });
  }
});

// Update an existing offer
router.put('/api/offers/:id', async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const offerIndex = offers.findIndex(o => o.id === offerId);
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    const {
      candidateName,
      jobTitle,
      startDate,
      baseSalary,
      signingBonus,
      equityShares,
      vacationDays,
      healthBenefits,
      workArrangement,
      status
    } = req.body;
    
    const updatedOffer = {
      ...offers[offerIndex],
      candidateName: candidateName || offers[offerIndex].candidateName,
      jobTitle: jobTitle || offers[offerIndex].jobTitle,
      startDate: startDate || offers[offerIndex].startDate,
      status: status || offers[offerIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    // Update compensation if provided
    if (baseSalary !== undefined || signingBonus !== undefined || equityShares !== undefined) {
      const newBaseSalary = parseFloat(baseSalary !== undefined ? baseSalary : offers[offerIndex].compensation.baseSalary);
      const newSigningBonus = parseFloat(signingBonus !== undefined ? signingBonus : offers[offerIndex].compensation.signingBonus);
      
      updatedOffer.compensation = {
        baseSalary: newBaseSalary,
        signingBonus: newSigningBonus,
        equityShares: parseFloat(equityShares !== undefined ? equityShares : offers[offerIndex].compensation.equityShares),
        totalCash: newBaseSalary + newSigningBonus
      };
    }
    
    // Update benefits if provided
    if (vacationDays !== undefined || healthBenefits !== undefined || workArrangement !== undefined) {
      updatedOffer.benefits = {
        vacationDays: parseInt(vacationDays !== undefined ? vacationDays : offers[offerIndex].benefits.vacationDays),
        healthBenefits: healthBenefits || offers[offerIndex].benefits.healthBenefits,
        workArrangement: workArrangement || offers[offerIndex].benefits.workArrangement
      };
    }
    
    offers[offerIndex] = updatedOffer;
    
    res.json({
      success: true,
      message: 'Offer updated successfully',
      offer: updatedOffer
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update offer',
      error: error.message
    });
  }
});

// Approve and send offer
router.post('/api/offers/:id/approve', async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, offerId)
      .query(`
        UPDATE [dbo].[Offers]
        SET Status = 'Approved',
            SentDate = GETDATE(),
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE OfferId = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Offer approved and sent successfully',
      offer: result.recordset[0]
    });
  } catch (error) {
    console.error('Error approving offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve offer',
      error: error.message
    });
  }
});

// Delete an offer
router.delete('/api/offers/:id', async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, offerId)
      .query(`
        DELETE FROM [dbo].[Offers]
        WHERE OfferId = @id
      `);
    
    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete offer',
      error: error.message
    });
  }
});

module.exports = router;
