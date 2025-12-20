const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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

    const { jobTitle, requiredSkills } = req.body;
    
    // Simulate AI screening analysis
    // In production, this would integrate with actual AI/ML service
    const screeningResult = await performAIScreening(
      req.file.path,
      jobTitle,
      requiredSkills ? JSON.parse(requiredSkills) : []
    );

    res.json({
      success: true,
      result: screeningResult
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
async function performAIScreening(filePath, jobTitle, requiredSkills) {
  // This is a simulation. In production, you would:
  // 1. Parse the PDF to extract text
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
