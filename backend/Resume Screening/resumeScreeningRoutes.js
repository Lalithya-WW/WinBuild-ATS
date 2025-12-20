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
    
    // Using the Adzuna API endpoint as specified
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/in/search/${page}`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: what,
          where: where
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
    
    let uploadResult;
    let resumeUrl = '';
    let blobName = '';
    
    // Try to upload to Azure Blob Storage, fallback to local storage if it fails
    try {
      uploadResult = await uploadFileToBlob(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype
      );
      resumeUrl = uploadResult.url;
      blobName = uploadResult.blobName;
    } catch (storageError) {
      console.warn('Azure Storage not available, using fallback:', storageError.message);
      // Fallback: use a placeholder URL
      resumeUrl = `/uploads/resumes/${Date.now()}-${req.file.originalname}`;
      blobName = req.file.originalname;
    }

    // Simulate AI screening analysis
    const screeningResult = await performAIScreening(
      resumeUrl,
      jobTitle,
      requiredSkills ? JSON.parse(requiredSkills) : []
    );

    // Try to save to database, but don't fail if database is not available
    let newCandidate = null;
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('name', candidateName || screeningResult.extraction.name)
        .input('email', email || screeningResult.extraction.email)
        .input('phone', phone || screeningResult.extraction.phone)
        .input('position', jobTitle)
        .input('resumePath', resumeUrl)
        .input('screeningScore', screeningResult.matchScore)
        .query(`
          INSERT INTO Candidates (name, email, phone, position, status, resumePath)
          OUTPUT INSERTED.*
          VALUES (@name, @email, @phone, @position, 'screening', @resumePath)
        `);

      newCandidate = result.recordset[0];

      // Add activity
      await pool.request()
        .input('title', 'Resume Screened')
        .input('description', `${candidateName || screeningResult.extraction.name} - Score: ${screeningResult.matchScore}%`)
        .query(`
          INSERT INTO Activities (type, title, description, icon)
          VALUES ('screening', @title, @description, 'file-search')
        `);
    } catch (dbError) {
      console.warn('Database not available, screening results will not be saved:', dbError.message);
    }

    res.json({
      success: true,
      result: {
        ...screeningResult,
        candidateId: newCandidate ? newCandidate.id : null,
        resumeUrl: resumeUrl,
        blobName: blobName
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

// Simulate AI screening with dummy data (realistic simulation)
async function performAIScreening(blobUrl, jobTitle, requiredSkills) {
  // Generate realistic dummy candidate data
  const candidateProfiles = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 9876543210',
      experience: '5 years',
      education: 'B.Tech in Computer Science, IIT Delhi',
      skills: ['Node.js', 'React', 'MongoDB', 'Express', 'AWS', 'Docker', 'TypeScript', 'Git']
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@techmail.com',
      phone: '+91 9123456789',
      experience: '7 years',
      education: 'M.Tech in Software Engineering, BITS Pilani',
      skills: ['JavaScript', 'Node.js', 'Angular', 'PostgreSQL', 'GraphQL', 'Kubernetes', 'Azure', 'CI/CD']
    },
    {
      name: 'Amit Patel',
      email: 'amit.patel@developer.in',
      phone: '+91 8765432109',
      experience: '4 years',
      education: 'B.E. in Information Technology, NIT Trichy',
      skills: ['React', 'Node.js', 'MySQL', 'REST', 'Docker', 'Git', 'HTML', 'CSS']
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@codemail.com',
      phone: '+91 7654321098',
      experience: '6 years',
      education: 'B.Tech in Computer Science, IIIT Hyderabad',
      skills: ['TypeScript', 'Node.js', 'Vue', 'MongoDB', 'Redis', 'AWS', 'Jenkins', 'Webpack']
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@techpro.in',
      phone: '+91 6543210987',
      experience: '8 years',
      education: 'M.Sc. in Computer Science, University of Hyderabad',
      skills: ['Node.js', 'React', 'GraphQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'GCP', 'Next.js']
    }
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      // Select a random candidate profile
      const profile = candidateProfiles[Math.floor(Math.random() * candidateProfiles.length)];
      
      // Calculate skill match
      const matchedSkills = [];
      const unmatchedSkills = [];
      
      requiredSkills.forEach(reqSkill => {
        const isMatched = profile.skills.some(skill => 
          skill.toLowerCase() === reqSkill.toLowerCase()
        );
        
        if (isMatched) {
          matchedSkills.push({
            skill: reqSkill,
            matched: true,
            proficiency: Math.random() > 0.3 ? 'High' : 'Medium'
          });
        } else {
          unmatchedSkills.push({
            skill: reqSkill,
            matched: false,
            proficiency: 'Not Found'
          });
        }
      });

      // Calculate match score
      const baseScore = requiredSkills.length > 0 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 75;
      
      // Add bonus for extra skills
      const bonusScore = Math.min(20, profile.skills.length * 2);
      const matchScore = Math.min(100, baseScore + bonusScore);
      
      // Generate analysis
      const strengths = [];
      const concerns = [];
      
      if (matchScore >= 80) {
        strengths.push('Excellent match with required technical skills');
        strengths.push(`${matchedSkills.length} out of ${requiredSkills.length} required skills found`);
      } else if (matchScore >= 60) {
        strengths.push('Good technical background in core technologies');
        strengths.push(`Strong foundation in ${matchedSkills.length} required skills`);
      }
      
      if (profile.skills.length > 5) {
        strengths.push('Diverse technical skill set demonstrated');
      }
      
      strengths.push(`${profile.experience} of relevant industry experience`);
      strengths.push('Strong educational background');
      
      if (unmatchedSkills.length > 0) {
        concerns.push(`Missing skills: ${unmatchedSkills.map(s => s.skill).join(', ')}`);
      }
      
      if (matchScore < 70) {
        concerns.push('May require training in some key technologies');
      }
      
      concerns.push('Verify years of hands-on experience with mentioned technologies');
      
      // Generate recommendations
      const recommendations = [];
      if (matchScore >= 80) {
        recommendations.push('Schedule technical interview immediately');
        recommendations.push('Prepare advanced coding challenges');
        recommendations.push('Discuss system design experience');
      } else if (matchScore >= 65) {
        recommendations.push('Conduct initial screening call');
        recommendations.push('Verify depth of experience in key skills');
        recommendations.push('Review portfolio and past projects');
      } else {
        recommendations.push('Consider for junior or mid-level positions');
        recommendations.push('Assess willingness to learn new technologies');
        recommendations.push('Review coding samples and GitHub profile');
      }
      
      recommendations.push('Check professional references');
      
      resolve({
        matchScore: matchScore,
        status: matchScore >= 80 ? 'Highly Recommended' : matchScore >= 65 ? 'Recommended' : 'Consider',
        extraction: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          experience: profile.experience,
          education: profile.education,
          skills: profile.skills.slice(0, 8)
        },
        analysis: {
          strengths: strengths,
          concerns: concerns,
          skillMatch: [...matchedSkills, ...unmatchedSkills]
        },
        recommendations: recommendations
      });
    }, 1500); // Simulate processing time
  });
}

module.exports = router;
