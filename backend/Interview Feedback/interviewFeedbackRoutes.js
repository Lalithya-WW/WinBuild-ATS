const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory storage for submitted feedbacks (replace with database in production)
let submittedFeedbacks = [];

// Fetch interviews from Adzuna API (using jobs as interview data)
router.get('/interviews', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=17d79c26&app_key=eda0bf8d8c2f0f2581b576d038ec09c1&what=nodejs&where=Hyderabad'
    );

    // Transform job data into interview format
    const interviews = response.data.results.map((job, index) => ({
      id: job.id || `interview-${index}`,
      candidateName: generateCandidateName(index),
      position: job.title,
      dateTime: generateInterviewDate(index),
      company: job.company?.display_name || 'Tech Company',
      location: job.location?.display_name || 'Hyderabad',
      description: job.description
    }));

    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get specific interview details
router.get('/interviews/:id', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=17d79c26&app_key=eda0bf8d8c2f0f2581b576d038ec09c1&what=nodejs&where=Hyderabad'
    );

    const job = response.data.results.find((j, index) => 
      (j.id && j.id.toString() === req.params.id) || 
      `interview-${index}` === req.params.id
    );

    if (!job) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const index = response.data.results.indexOf(job);
    const interview = {
      id: job.id || `interview-${index}`,
      candidateName: generateCandidateName(index),
      position: job.title,
      dateTime: generateInterviewDate(index),
      company: job.company?.display_name || 'Tech Company',
      location: job.location?.display_name || 'Hyderabad',
      description: job.description
    };

    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error.message);
    res.status(500).json({ error: 'Failed to fetch interview details' });
  }
});

// Submit feedback for an interview
router.post('/feedback', async (req, res) => {
  try {
    const {
      interviewId,
      candidateName,
      position,
      dateTime,
      technicalSkills,
      communication,
      problemSolving,
      cultureFit,
      overallRating,
      keyStrengths,
      areasOfConcern,
      additionalComments,
      recommendation
    } = req.body;

    // Validate required fields
    if (!interviewId || !overallRating || !recommendation) {
      return res.status(400).json({ 
        error: 'Missing required fields: interviewId, overallRating, or recommendation' 
      });
    }

    // In a real application, this would save to a database
    const feedback = {
      id: Date.now(),
      interviewId,
      candidateName,
      position,
      dateTime,
      ratings: {
        technicalSkills,
        communication,
        problemSolving,
        cultureFit,
        overallRating
      },
      feedback: {
        keyStrengths,
        areasOfConcern,
        additionalComments
      },
      recommendation,
      submittedAt: new Date().toISOString()
    };

    // Store in memory
    submittedFeedbacks.push(feedback);

    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedback 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error.message);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get all submitted feedbacks
router.get('/feedbacks', async (req, res) => {
  try {
    // Return feedbacks sorted by submission date (newest first)
    const sortedFeedbacks = [...submittedFeedbacks].sort((a, b) => 
      new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    res.json(sortedFeedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error.message);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

// Helper function to generate candidate names
function generateCandidateName(index) {
  const firstNames = ['Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Lisa', 'John', 'Jennifer'];
  const lastNames = ['Chen', 'Patel', 'Kumar', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Martinez'];
  
  return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
}

// Helper function to generate interview dates
function generateInterviewDate(index) {
  const date = new Date();
  date.setDate(date.getDate() + index);
  date.setHours(14 + (index % 4), 0, 0, 0);
  
  return date.toISOString();
}

module.exports = router;
