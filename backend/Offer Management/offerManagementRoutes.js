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

// Initialize Offers table
async function initializeOffersTable() {
  try {
    const pool = await getConnection();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Offers' AND xtype='U')
      CREATE TABLE Offers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        candidateId INT,
        candidateName NVARCHAR(255) NOT NULL,
        jobTitle NVARCHAR(255) NOT NULL,
        startDate DATE,
        baseSalary DECIMAL(18,2),
        signingBonus DECIMAL(18,2),
        equityShares INT,
        totalCash DECIMAL(18,2),
        vacationDays INT,
        healthBenefits NVARCHAR(255),
        workArrangement NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'draft',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        approvedAt DATETIME
      );
    `);
    console.log('✅ Offers table initialized');
  } catch (err) {
    console.error('❌ Offers table initialization failed:', err.message);
  }
}

// Initialize on module load
initializeOffersTable();

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
        id,
        candidateId,
        candidateName,
        jobTitle,
        startDate,
        baseSalary,
        signingBonus,
        equityShares,
        totalCash,
        vacationDays,
        healthBenefits,
        workArrangement,
        status,
        createdAt
      FROM Offers
      ORDER BY createdAt DESC
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

// Get offer by ID
router.get('/api/offers/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Offers WHERE id = @id');
    
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

// Create new offer
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
      status = 'draft'
    } = req.body;
    
    // Validation
    if (!candidateName || !jobTitle || !baseSalary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateName, jobTitle, baseSalary'
      });
    }
    
    const totalCash = parseFloat(baseSalary || 0) + parseFloat(signingBonus || 0);
    
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('candidateId', sql.Int, candidateId || null)
        .input('candidateName', sql.NVarChar, candidateName)
        .input('jobTitle', sql.NVarChar, jobTitle)
        .input('startDate', sql.Date, startDate || null)
        .input('baseSalary', sql.Decimal(18, 2), parseFloat(baseSalary))
        .input('signingBonus', sql.Decimal(18, 2), parseFloat(signingBonus || 0))
        .input('equityShares', sql.Int, parseInt(equityShares || 0))
        .input('totalCash', sql.Decimal(18, 2), totalCash)
        .input('vacationDays', sql.Int, parseInt(vacationDays || 20))
        .input('healthBenefits', sql.NVarChar, healthBenefits || 'Premium Coverage')
        .input('workArrangement', sql.NVarChar, workArrangement || 'Hybrid')
        .input('status', sql.NVarChar, status)
        .query(`
          INSERT INTO Offers (
            candidateId, candidateName, jobTitle, startDate,
            baseSalary, signingBonus, equityShares, totalCash,
            vacationDays, healthBenefits, workArrangement, status
          )
          OUTPUT INSERTED.*
          VALUES (
            @candidateId, @candidateName, @jobTitle, @startDate,
            @baseSalary, @signingBonus, @equityShares, @totalCash,
            @vacationDays, @healthBenefits, @workArrangement, @status
          )
        `);
      
      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        offer: result.recordset[0]
      });
    } catch (dbError) {
      // Fallback to in-memory storage
      console.error('Database error, using in-memory storage:', dbError.message);
      
      const newOffer = {
        id: offerIdCounter++,
        candidateId,
        candidateName,
        jobTitle,
        startDate,
        compensation: {
          baseSalary: parseFloat(baseSalary),
          signingBonus: parseFloat(signingBonus || 0),
          equityShares: parseFloat(equityShares || 0),
          totalCash: totalCash
        },
        benefits: {
          vacationDays: parseInt(vacationDays || 20),
          healthBenefits: healthBenefits || 'Premium Coverage',
          workArrangement: workArrangement || 'Hybrid'
        },
        status: status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      offers.push(newOffer);
      
      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        offer: newOffer
      });
    }
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
    
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, offerId)
        .query(`
          UPDATE Offers
          SET status = 'approved',
              approvedAt = GETDATE(),
              updatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
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
    } catch (dbError) {
      // Fallback to in-memory storage
      console.error('Database error, using in-memory storage:', dbError.message);
      
      const offerIndex = offers.findIndex(o => o.id === offerId);
      
      if (offerIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
      }
      
      offers[offerIndex].status = 'approved';
      offers[offerIndex].approvedAt = new Date().toISOString();
      offers[offerIndex].updatedAt = new Date().toISOString();
      
      res.json({
        success: true,
        message: 'Offer approved and sent successfully',
        offer: offers[offerIndex]
      });
    }
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
router.delete('/api/offers/:id', (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const offerIndex = offers.findIndex(o => o.id === offerId);
    
    if (offerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    offers.splice(offerIndex, 1);
    
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
