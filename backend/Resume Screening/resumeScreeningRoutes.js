const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const { uploadFileToBlob, deleteFileFromBlob } = require('../config/azureStorage');
const { getConnection } = require('../config/database');

// Configure multer for memory storage (Azure Blob)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Adzuna API credentials
const ADZUNA_APP_ID = '17d79c26';
const ADZUNA_APP_KEY = 'eda0bf8d8c2f0f2581b576d038ec09c1';

// Get job positions from Adzuna API
router.get('/jobs', async (req, res) => {
  try {
    const { what = 'nodejs', where = 'Hyderabad', page = 1 } = req.query;
    
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/in/search/${page}`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: what,
          where: where,
          results_per_page: 20
        }
      }
    );

    // Transform the data to extract relevant job information
    const jobs = response.data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      created: job.created,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      category: job.category.label,
      // Extract skills from description (basic keyword matching)
      requiredSkills: extractSkills(job.description)
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
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Get specific job by ID
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Since Adzuna doesn't have a direct job by ID endpoint, 
    // we'll search and filter
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/in/search/1`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: 'nodejs',
          where: 'Hyderabad'
        }
      }
    );

    const job = response.data.results.find(j => j.id === id);
    
    if (job) {
      res.json({
        success: true,
        job: {
          id: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          requiredSkills: extractSkills(job.description)
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
  } catch (error) {
    console.error('Error fetching job:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// Upload and screen resume
router.post('/screen', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { jobTitle, requiredSkills, candidateName, email, phone } = req.body;
    
    // Upload file to Azure Blob Storage
    const uploadResult = await uploadFileToBlob(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    // Simulate AI screening analysis
    const screeningResult = await performAIScreening(
      uploadResult.url,
      jobTitle,
      requiredSkills ? JSON.parse(requiredSkills) : []
    );

    // Save candidate to database with screening results
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', candidateName || screeningResult.extraction.name)
      .input('email', email || screeningResult.extraction.email)
      .input('phone', phone || screeningResult.extraction.phone)
      .input('position', jobTitle)
      .input('resumePath', uploadResult.url)
      .input('screeningScore', screeningResult.matchScore)
      .query(`
        INSERT INTO Candidates (name, email, phone, position, status, resumePath)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @phone, @position, 'screening', @resumePath)
      `);

    const newCandidate = result.recordset[0];

    // Add activity
    await pool.request()
      .input('title', 'Resume Screened')
      .input('description', `${candidateName || screeningResult.extraction.name} - Score: ${screeningResult.matchScore}%`)
      .query(`
        INSERT INTO Activities (type, title, description, icon)
        VALUES ('screening', @title, @description, 'file-search')
      `);

    res.json({
      success: true,
      result: {
        ...screeningResult,
        candidateId: newCandidate.id,
        resumeUrl: uploadResult.url,
        blobName: uploadResult.blobName
      }
    });
  } catch (error) {
    console.error('Error screening resume:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to screen resume',
      error: error.message
    });
  }
});

// Helper function to extract skills from job description
function extractSkills(description) {
  const skillKeywords = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'AWS', 'Docker',
    'Python', 'Java', 'MongoDB', 'SQL', 'Git', 'Kubernetes',
    'Angular', 'Vue', 'Express', 'REST', 'GraphQL', 'Redis',
    'PostgreSQL', 'MySQL', 'Azure', 'GCP', 'CI/CD', 'Jenkins',
    'HTML', 'CSS', 'SASS', 'Webpack', 'Next.js', 'React Native'
  ];

  const foundSkills = [];
  const lowerDesc = description.toLowerCase();

  skillKeywords.forEach(skill => {
    if (lowerDesc.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills.slice(0, 5); // Return top 5 skills
}

// Simulate AI screening (placeholder for actual AI integration)
async function performAIScreening(blobUrl, jobTitle, requiredSkills) {
  // This is a simulation. In production, you would:
  // 1. Download the file from blob URL or pass the URL to AI service
  // 2. Use NLP/AI to extract candidate information
  // 3. Match skills and experience against job requirements
  // 4. Generate a detailed analysis and score

  return new Promise((resolve) => {
    setTimeout(() => {
      const matchScore = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      resolve({
        matchScore: matchScore,
        status: matchScore >= 80 ? 'Highly Recommended' : matchScore >= 65 ? 'Recommended' : 'Consider',
        extraction: {
          name: 'Candidate Name',
          email: 'candidate@example.com',
          phone: '+91 9876543210',
          experience: '5+ years',
          education: 'B.Tech in Computer Science',
          skills: requiredSkills.slice(0, 3).concat(['Git', 'Agile'])
        },
        analysis: {
          strengths: [
            'Strong technical background in required skills',
            'Relevant industry experience',
            'Good educational qualification'
          ],
          concerns: [
            'May need additional training in some technologies',
            'Location compatibility to be verified'
          ],
          skillMatch: requiredSkills.map(skill => ({
            skill: skill,
            matched: Math.random() > 0.3,
            proficiency: Math.random() > 0.5 ? 'High' : 'Medium'
          }))
        },
        recommendations: [
          'Schedule technical interview',
          'Verify years of experience',
          'Check references'
        ]
      });
    }, 2000); // Simulate processing time
  });
}

module.exports = router;
