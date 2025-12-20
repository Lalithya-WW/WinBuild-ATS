const express = require('express');
const router = express.Router();
const axios = require('axios');
const { sendInterviewInvitation } = require('../config/sendgrid');
const { getConnection } = require('../config/database');
const sql = require('mssql');

// Store scheduled interviews in memory (in production, use a database)
let scheduledInterviews = [
  {
    id: 1,
    candidateName: "Robert Kim",
    jobPosition: "Senior Software Engineer",
    interviewType: "Technical Round",
    date: "Saturday, December 20, 2025",
    time: "10:00 AM",
    location: "Zoom",
    panelMembers: ["John Smith", "Emma Wilson"]
  },
  {
    id: 2,
    candidateName: "Jessica Wong",
    jobPosition: "Product Manager",
    interviewType: "Behavioral Round",
    date: "Saturday, December 20, 2025",
    time: "2:00 PM",
    location: "Conference Room A",
    panelMembers: ["Rachel Green", "Tom Anderson"]
  },
  {
    id: 3,
    candidateName: "David Brown",
    jobPosition: "UX Designer",
    interviewType: "Design Review",
    date: "Sunday, December 21, 2025",
    time: "11:00 AM",
    location: "Zoom",
    panelMembers: ["Maria Garcia"]
  }
];

// Panel members pool
const panelMembers = [
  {
    id: 1,
    name: "Tom Anderson",
    role: "HR Manager",
    email: "tom.anderson@wininre.com",
    initials: "TA"
  },
  {
    id: 2,
    name: "Maria Garcia",
    role: "Designer Lead",
    email: "maria.garcia@wininre.com",
    initials: "MG"
  },
  {
    id: 3,
    name: "Kevin Lee",
    role: "Senior Analyst",
    email: "kevin.lee@wininre.com",
    initials: "KL"
  },
  {
    id: 4,
    name: "John Smith",
    role: "Tech Lead",
    email: "john.smith@wininre.com",
    initials: "JS"
  },
  {
    id: 5,
    name: "Emma Wilson",
    role: "Senior Engineer",
    email: "emma.wilson@wininre.com",
    initials: "EW"
  },
  {
    id: 6,
    name: "Rachel Green",
    role: "Product Lead",
    email: "rachel.green@wininre.com",
    initials: "RG"
  }
];

// Stored candidates (simulated)
let candidates = [
  {
    id: 1,
    name: "Michael Chen",
    email: "mchen@email.com",
    status: "EXP",
    experience: "5 years"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sjohnson@email.com",
    status: "NEW",
    experience: "3 years"
  },
  {
    id: 3,
    name: "Alex Kumar",
    email: "akumar@email.com",
    status: "EXP",
    experience: "7 years"
  }
];

// Get candidates from Adzuna API
router.get('/candidates', async (req, res) => {
  try {
    // Fetch from Adzuna API
    const response = await axios.get('https://api.adzuna.com/v1/api/jobs/in/search/1', {
      params: {
        app_id: '17d79c26',
        app_key: 'eda0bf8d8c2f0f2581b576d038ec09c1',
        what: 'nodejs',
        where: 'Hyderabad',
        results_per_page: 10
      }
    });

    // Transform Adzuna data to candidate format
    const adzunaCandidates = response.data.results.map((job, index) => ({
      id: `adzuna_${index}`,
      name: job.company?.display_name || `Candidate ${index + 1}`,
      email: `candidate${index + 1}@email.com`,
      status: index % 2 === 0 ? "EXP" : "NEW",
      jobTitle: job.title,
      location: job.location?.display_name || 'Hyderabad'
    }));

    // Combine with existing candidates
    const allCandidates = [...candidates, ...adzunaCandidates];
    
    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching candidates:', error.message);
    // Fallback to local candidates if API fails
    res.json(candidates);
  }
});

// Get job positions from Adzuna API
router.get('/jobs', async (req, res) => {
  try {
    const response = await axios.get('https://api.adzuna.com/v1/api/jobs/in/search/1', {
      params: {
        app_id: '17d79c26',
        app_key: 'eda0bf8d8c2f0f2581b576d038ec09c1',
        what: 'nodejs',
        where: 'Hyderabad',
        results_per_page: 15
      }
    });

    const jobs = response.data.results.map((job, index) => ({
      id: `job_${index}`,
      title: job.title,
      company: job.company?.display_name || 'Not specified',
      location: job.location?.display_name || 'Hyderabad'
    }));

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    // Fallback to default jobs
    res.json([
      { id: 1, title: "Product Manager - Product", company: "TechCorp", location: "Hyderabad" },
      { id: 2, title: "Senior Software Engineer", company: "DevCo", location: "Hyderabad" },
      { id: 3, title: "UX Designer", company: "DesignHub", location: "Hyderabad" }
    ]);
  }
});

// Get interview panel members
router.get('/panel-members', (req, res) => {
  res.json(panelMembers);
});

// Get scheduled interviews
router.get('/scheduled', (req, res) => {
  res.json(scheduledInterviews);
});

// Schedule a new interview
router.post('/schedule', async (req, res) => {
  try {
    const { 
      candidateName, 
      candidateEmail,
      jobPosition, 
      interviewType, 
      date, 
      time, 
      location, 
      panelMembers: selectedPanelMembers,
      additionalNotes 
    } = req.body;

    // Validate required fields
    if (!candidateName || !jobPosition || !date || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields: candidateName, jobPosition, date, time' 
      });
    }

    const newInterview = {
      id: scheduledInterviews.length + 1,
      candidateName,
      candidateEmail,
      jobPosition,
      interviewType,
      date,
      time,
      location,
      panelMembers: selectedPanelMembers,
      additionalNotes,
      createdAt: new Date().toISOString()
    };

    scheduledInterviews.unshift(newInterview);

    // Prepare interview date/time for email
    const interviewDateTime = new Date(`${date} ${time}`);
    
    // Generate meeting link if location is Zoom or online
    let meetingLink = null;
    if (location && (location.toLowerCase().includes('zoom') || location.toLowerCase().includes('online'))) {
      meetingLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`; // Mock Zoom link
    }

    // Save to database if connection available
    try {
      const pool = await getConnection();
      await pool.request()
        .input('candidateName', sql.NVarChar, candidateName)
        .input('position', sql.NVarChar, jobPosition)
        .input('scheduleDate', sql.DateTime, interviewDateTime)
        .input('interviewType', sql.NVarChar, interviewType || 'Interview')
        .input('status', sql.NVarChar, 'scheduled')
        .query(`
          INSERT INTO Interviews (candidateName, position, scheduleDate, interviewType, status, createdAt)
          VALUES (@candidateName, @position, @scheduleDate, @interviewType, @status, GETDATE())
        `);

      // Log activity
      await pool.request()
        .input('type', sql.NVarChar, 'interview_scheduled')
        .input('title', sql.NVarChar, 'Interview Scheduled')
        .input('description', sql.NVarChar, `${candidateName} scheduled for ${jobPosition} on ${date} at ${time}`)
        .input('icon', sql.NVarChar, '📅')
        .query(`
          INSERT INTO Activities (type, title, description, icon, createdAt)
          VALUES (@type, @title, @description, @icon, GETDATE())
        `);
    } catch (dbError) {
      console.error('Database save failed (continuing with in-memory):', dbError.message);
    }

    // Send interview invitation email if email is provided
    if (candidateEmail) {
      try {
        await sendInterviewInvitation({
          candidateName,
          candidateEmail,
          position: jobPosition,
          interviewDate: interviewDateTime,
          interviewType: interviewType || 'Interview',
          meetingLink
        });
        
        console.log(`✅ Interview invitation email sent to ${candidateEmail}`);
        
        // Add meeting link to response
        newInterview.meetingLink = meetingLink;
        newInterview.emailSent = true;
      } catch (emailError) {
        console.error('Failed to send interview invitation email:', emailError.message);
        newInterview.emailSent = false;
        newInterview.emailError = emailError.message;
      }
    }

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview: newInterview,
      emailSent: candidateEmail ? newInterview.emailSent : false
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Delete an interview
router.delete('/scheduled/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = scheduledInterviews.findIndex(interview => interview.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    scheduledInterviews.splice(index, 1);
    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

module.exports = router;
