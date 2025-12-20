const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Ensure Jobs table has all required columns
async function ensureJobsTableColumns() {
  try {
    const pool = await getConnection();
    
    // Add missing columns if they don't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'employment_type')
      ALTER TABLE Jobs ADD employment_type NVARCHAR(100);
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'description')
      ALTER TABLE Jobs ADD description NVARCHAR(MAX);
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'required_skills')
      ALTER TABLE Jobs ADD required_skills NVARCHAR(MAX);
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'experience_range')
      ALTER TABLE Jobs ADD experience_range NVARCHAR(100);
    `);
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'posted_date')
      ALTER TABLE Jobs ADD posted_date DATETIME DEFAULT GETDATE();
    `);
    
    console.log('✅ Jobs table columns verified/updated');
  } catch (err) {
    console.error('❌ Error updating Jobs table:', err.message);
  }
}

// Initialize columns on module load
ensureJobsTableColumns();

// Create a new job posting
router.post('/create', async (req, res) => {
  try {
    const {
      jobTitle,
      department,
      location,
      employmentType,
      jobDescription,
      requiredSkills,
      experienceRange
    } = req.body;

    // Validate required fields
    if (!jobTitle || !department || !location || !employmentType || !jobDescription || !requiredSkills || !experienceRange) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate job description length
    if (jobDescription.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Job description must be at least 50 characters'
      });
    }

    // Validate required skills
    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill is required'
      });
    }

    const pool = await getConnection();

    // Create the job posting
    const result = await pool.request()
      .input('title', sql.NVarChar, jobTitle)
      .input('department', sql.NVarChar, department)
      .input('location', sql.NVarChar, location)
      .input('employment_type', sql.NVarChar, employmentType)
      .input('description', sql.NVarChar(sql.MAX), jobDescription)
      .input('required_skills', sql.NVarChar(sql.MAX), JSON.stringify(requiredSkills))
      .input('experience_range', sql.NVarChar, experienceRange)
      .input('status', sql.NVarChar, 'open')
      .query(`
        INSERT INTO Jobs (
          title, 
          department, 
          location, 
          employment_type, 
          description, 
          required_skills, 
          experience_range,
          status,
          posted_date
        ) 
        OUTPUT INSERTED.*
        VALUES (
          @title, 
          @department, 
          @location, 
          @employment_type, 
          @description, 
          @required_skills, 
          @experience_range,
          @status,
          GETDATE()
        )
      `);

    const newJob = result.recordset[0];

    res.json({
      success: true,
      message: 'Job created successfully',
      jobId: newJob.id,
      job: {
        id: newJob.id,
        jobTitle: newJob.title,
        department: newJob.department,
        location: newJob.location,
        employmentType: newJob.employment_type,
        jobDescription: newJob.description,
        requiredSkills: JSON.parse(newJob.required_skills),
        experienceRange: newJob.experience_range,
        status: newJob.status,
        postedDate: newJob.posted_date
      }
    });

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job posting',
      error: error.message
    });
  }
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        id,
        title,
        department,
        location,
        employment_type,
        description,
        required_skills,
        experience_range,
        status,
        posted_date,
        createdAt,
        updatedAt
      FROM Jobs
      ORDER BY posted_date DESC
    `);

    // Parse required_skills JSON
    const jobsWithParsedSkills = result.recordset.map(job => ({
      ...job,
      required_skills: job.required_skills ? JSON.parse(job.required_skills) : []
    }));

    res.json({
      success: true,
      jobs: jobsWithParsedSkills
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          id,
          title,
          department,
          location,
          employment_type,
          description,
          required_skills,
          experience_range,
          status,
          posted_date,
          createdAt,
          updatedAt
        FROM Jobs
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = result.recordset[0];
    job.required_skills = job.required_skills ? JSON.parse(job.required_skills) : [];

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      jobTitle,
      department,
      location,
      employmentType,
      jobDescription,
      requiredSkills,
      experienceRange,
      status
    } = req.body;

    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('title', sql.NVarChar, jobTitle)
      .input('department', sql.NVarChar, department)
      .input('location', sql.NVarChar, location)
      .input('employment_type', sql.NVarChar, employmentType)
      .input('description', sql.NVarChar(sql.MAX), jobDescription)
      .input('required_skills', sql.NVarChar(sql.MAX), JSON.stringify(requiredSkills))
      .input('experience_range', sql.NVarChar, experienceRange)
      .input('status', sql.NVarChar, status || 'Active')
      .query(`
        UPDATE Jobs 
        SET 
          title = @title,
          department = @department,
          location = @location,
          employment_type = @employment_type,
          description = @description,
          required_skills = @required_skills,
          experience_range = @experience_range,
          status = @status,
          updatedAt = GETDATE()
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job updated successfully'
    });

  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM Jobs WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

module.exports = router;
