const express = require('express');
const router = express.Router();
const axios = require('axios');

// Mock candidate data generated from job listings
const generateCandidatesFromJobs = (jobs) => {
  const stages = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
  const firstNames = ['Sarah', 'Emily', 'Alex', 'Lisa', 'Michael', 'Robert', 'Jessica', 'David', 'James', 'Maria'];
  const lastNames = ['Johnson', 'Davis', 'Martinez', 'Anderson', 'Chen', 'Kim', 'Wong', 'Brown', 'Wilson', 'Garcia'];
  
  const candidates = [];
  let candidateId = 1;
  
  jobs.forEach((job, index) => {
    if (index >= 12) return; // Limit to 12 candidates as shown in the UI
    
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().substring(0, 2)}@email.com`;
    
    // Distribute candidates across stages
    let stage;
    if (index < 2) stage = 'Applied';
    else if (index < 4) stage = 'Shortlisted';
    else if (index < 7) stage = 'Interview';
    else if (index < 8) stage = 'Offer';
    else stage = 'Hired';
    
    // Generate fit score
    const fitScore = Math.floor(Math.random() * 20) + 75; // 75-95%
    
    // Extract position from job title or use default
    const position = job.title || job.description?.substring(0, 30) || 'Software Engineer';
    
    const candidate = {
      id: candidateId++,
      name: `${firstName} ${lastName}`,
      email: email,
      position: position,
      stage: stage,
      fitScore: fitScore,
      date: getRandomDate(),
      avatar: `${firstName[0]}${lastName[0]}`
    };
    
    candidates.push(candidate);
  });
  
  return candidates;
};

// Generate a random date within the last 7 days
const getRandomDate = () => {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 7);
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};

// GET /api/candidate-pipeline - Get all candidates organized by stage
router.get('/', async (req, res) => {
  try {
    // Fetch jobs from Adzuna API
    const adzunaUrl = 'https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=17d79c26&app_key=eda0bf8d8c2f0f2581b576d038ec09c1&what=nodejs&where=Hyderabad';
    
    const response = await axios.get(adzunaUrl);
    const jobs = response.data.results || [];
    
    // Generate candidates from job listings
    const candidates = generateCandidatesFromJobs(jobs);
    
    // Organize candidates by stage
    const pipeline = {
      Applied: candidates.filter(c => c.stage === 'Applied'),
      Shortlisted: candidates.filter(c => c.stage === 'Shortlisted'),
      Interview: candidates.filter(c => c.stage === 'Interview'),
      Offer: candidates.filter(c => c.stage === 'Offer'),
      Hired: candidates.filter(c => c.stage === 'Hired')
    };
    
    // Calculate stats
    const stats = {
      totalCandidates: candidates.length,
      activePipeline: candidates.filter(c => c.stage !== 'Hired').length
    };
    
    res.json({
      success: true,
      pipeline,
      stats,
      candidates
    });
  } catch (error) {
    console.error('Error fetching candidate pipeline data:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate pipeline data',
      error: error.message
    });
  }
});

// PUT /api/candidate-pipeline/:id - Update candidate stage
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    
    // In a real application, this would update the database
    // For now, we'll just acknowledge the update
    res.json({
      success: true,
      message: `Candidate ${id} moved to ${stage}`,
      candidateId: id,
      newStage: stage
    });
  } catch (error) {
    console.error('Error updating candidate stage:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update candidate stage',
      error: error.message
    });
  }
});

module.exports = router;
