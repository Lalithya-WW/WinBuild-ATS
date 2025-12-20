const express = require('express');
const multer = require('multer');
const { uploadFileToBlob, deleteFileFromBlob } = require('../config/azureStorage');
const { getConnection } = require('../config/database');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, DOCX files
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Upload resume endpoint
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { candidateName, email, phone, position } = req.body;

    if (!candidateName || !position) {
      return res.status(400).json({ error: 'Candidate name and position are required' });
    }

    // Upload file to Azure Blob Storage
    const uploadResult = await uploadFileToBlob(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    // Save candidate to database
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', candidateName)
      .input('email', email || null)
      .input('phone', phone || null)
      .input('position', position)
      .input('resumePath', uploadResult.url)
      .query(`
        INSERT INTO Candidates (name, email, phone, position, status, resumePath)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @phone, @position, 'active', @resumePath)
      `);

    const newCandidate = result.recordset[0];

    // Add activity
    await pool.request()
      .input('title', 'New Resume Uploaded')
      .input('description', `${candidateName} - ${position}`)
      .query(`
        INSERT INTO Activities (type, title, description, icon)
        VALUES ('upload', @title, @description, 'upload')
      `);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      candidate: {
        id: newCandidate.id,
        name: newCandidate.name,
        email: newCandidate.email,
        phone: newCandidate.phone,
        position: newCandidate.position,
        resumeUrl: newCandidate.resumePath,
        blobName: uploadResult.blobName
      }
    });
  } catch (err) {
    console.error('Error uploading resume:', err);
    
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload resume',
      details: err.message 
    });
  }
});

// Get resume URL
router.get('/:candidateId/resume', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', req.params.candidateId)
      .query('SELECT resumePath FROM Candidates WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const resumePath = result.recordset[0].resumePath;
    
    if (!resumePath) {
      return res.status(404).json({ error: 'No resume found for this candidate' });
    }

    res.json({
      resumeUrl: resumePath
    });
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Delete resume
router.delete('/:candidateId/resume', async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Get current resume path
    const result = await pool.request()
      .input('id', req.params.candidateId)
      .query('SELECT resumePath FROM Candidates WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const resumePath = result.recordset[0].resumePath;
    
    if (resumePath) {
      // Extract blob name from URL
      const blobName = resumePath.split('/').pop();
      
      // Delete from Azure Storage
      await deleteFileFromBlob(blobName);
      
      // Update database
      await pool.request()
        .input('id', req.params.candidateId)
        .query('UPDATE Candidates SET resumePath = NULL WHERE id = @id');
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting resume:', err);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;
