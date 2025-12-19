const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getConnection, initializeDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock Data
const mockData = {
  stats: {
    openJobs: 24,
    openJobsChange: '+3 this week',
    activeCandidates: 156,
    activeCandidatesChange: '+12 today',
    interviewsToday: 8,
    interviewsTodayChange: '3 pending feedback'
  },
  activities: [
    {
      id: 1,
      type: 'application',
      title: 'New Application Received',
      description: 'Sarah Johnson applied for Senior Software Engineer',
      timestamp: '3 minutes ago',
      icon: 'user-plus'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Scheduled',
      description: 'Michael Chan - Technical Round on Dec 20, 2:00 PM',
      timestamp: '1 hour ago',
      icon: 'calendar'
    },
    {
      id: 3,
      type: 'status',
      title: 'Status Update',
      description: 'Emily Davis moved to "Final Round"',
      timestamp: '2 hours ago',
      icon: 'arrow-right'
    },
    {
      id: 4,
      type: 'offer',
      title: 'Offer Extended',
      description: 'Job offer sent to Alex Martinez - Product Manager',
      timestamp: '3 hours ago',
      icon: 'check-circle'
    },
    {
      id: 5,
      type: 'application',
      title: 'New Application Received',
      description: 'Robert Kim applied for UX Designer',
      timestamp: '4 hours ago',
      icon: 'user-plus'
    }
  ],
  notifications: [
    {
      id: 1,
      type: 'feedback',
      title: 'Pending Interview Feedback',
      description: '3 interviews needing your feedback',
      priority: 'high'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Starting Soon',
      description: 'Technical Interview with John Doe at 2:00 PM',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'approval',
      title: 'Offer Approval Required',
      description: '2 job offers pending manager approval',
      priority: 'high'
    }
  ],
  user: {
    email: 'user@winwire.com',
    role: 'Recruiter',
    name: 'user'
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'WinWire ATS API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      activities: '/api/activities',
      notifications: '/api/notifications',
      user: '/api/user',
      createJob: 'POST /api/jobs',
      uploadResume: 'POST /api/resumes'
    },
    frontend: 'http://localhost:3000'
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const jobsCount = await pool.request().query('SELECT COUNT(*) as count FROM Jobs WHERE status = \'open\'');
    const candidatesCount = await pool.request().query('SELECT COUNT(*) as count FROM Candidates WHERE status = \'active\'');
    const interviewsToday = await pool.request().query(`
      SELECT COUNT(*) as count FROM Interviews 
      WHERE CAST(scheduleDate AS DATE) = CAST(GETDATE() AS DATE) AND status = 'scheduled'
    `);
    
    const stats = {
      openJobs: jobsCount.recordset[0].count,
      openJobsChange: '+3 this week',
      activeCandidates: candidatesCount.recordset[0].count,
      activeCandidatesChange: '+12 today',
      interviewsToday: interviewsToday.recordset[0].count,
      interviewsTodayChange: '3 pending feedback'
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 10 
        id, type, title, description, icon,
        CASE 
          WHEN DATEDIFF(MINUTE, createdAt, GETDATE()) < 1 THEN 'Just now'
          WHEN DATEDIFF(MINUTE, createdAt, GETDATE()) < 60 THEN CAST(DATEDIFF(MINUTE, createdAt, GETDATE()) AS VARCHAR) + ' minutes ago'
          WHEN DATEDIFF(HOUR, createdAt, GETDATE()) < 24 THEN CAST(DATEDIFF(HOUR, createdAt, GETDATE()) AS VARCHAR) + ' hours ago'
          ELSE CAST(DATEDIFF(DAY, createdAt, GETDATE()) AS VARCHAR) + ' days ago'
        END as timestamp
      FROM Activities 
      ORDER BY createdAt DESC
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id, type, title, description, priority 
      FROM Notifications 
      WHERE isRead = 0 
      ORDER BY createdAt DESC
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/user', (req, res) => {
  res.json(mockData.user);
});

app.post('/api/jobs', async (req, res) => {
  const { title, department, location } = req.body;
  
  try {
    const pool = await getConnection();
    
    // Insert new job
    const result = await pool.request()
      .input('title', title)
      .input('department', department)
      .input('location', location)
      .query(`
        INSERT INTO Jobs (title, department, location, status)
        OUTPUT INSERTED.*
        VALUES (@title, @department, @location, 'open')
      `);
    
    const newJob = result.recordset[0];
    
    // Add to activities
    await pool.request()
      .input('title', 'New Job Posted')
      .input('description', `${title} position opened`)
      .query(`
        INSERT INTO Activities (type, title, description, icon)
        VALUES ('job', @title, @description, 'briefcase')
      `);
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: newJob
    });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.post('/api/resumes', async (req, res) => {
  const { candidateName, position } = req.body;
  
  try {
    const pool = await getConnection();
    
    // Insert new candidate
    const result = await pool.request()
      .input('name', candidateName)
      .input('position', position)
      .query(`
        INSERT INTO Candidates (name, position, status)
        OUTPUT INSERTED.*
        VALUES (@name, @position, 'active')
      `);
    
    const newCandidate = result.recordset[0];
    
    // Add to activities
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
      application: newCandidate
    });
  } catch (err) {
    console.error('Error uploading resume:', err);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// ==================== JOBS ENDPOINTS ====================
// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM Jobs ORDER BY createdAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', req.params.id)
      .query('SELECT * FROM Jobs WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update job
app.put('/api/jobs/:id', async (req, res) => {
  const { title, department, location, status } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .input('title', title)
      .input('department', department)
      .input('location', location)
      .input('status', status)
      .query(`
        UPDATE Jobs 
        SET title = @title, department = @department, 
            location = @location, status = @status,
            updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    res.json({ success: true, message: 'Job updated successfully' });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Jobs WHERE id = @id');
    
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ==================== CANDIDATES ENDPOINTS ====================
// Get all candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM Candidates ORDER BY createdAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', req.params.id)
      .query('SELECT * FROM Candidates WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching candidate:', err);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Update candidate
app.put('/api/candidates/:id', async (req, res) => {
  const { name, email, phone, position, status } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .input('name', name)
      .input('email', email)
      .input('phone', phone)
      .input('position', position)
      .input('status', status)
      .query(`
        UPDATE Candidates 
        SET name = @name, email = @email, phone = @phone,
            position = @position, status = @status,
            updatedAt = GETDATE()
        WHERE id = @id
      `);
    
    res.json({ success: true, message: 'Candidate updated successfully' });
  } catch (err) {
    console.error('Error updating candidate:', err);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Delete candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Candidates WHERE id = @id');
    
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('Error deleting candidate:', err);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ==================== INTERVIEWS ENDPOINTS ====================
// Get all interviews
app.get('/api/interviews', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM Interviews ORDER BY scheduleDate DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get interview by ID
app.get('/api/interviews/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', req.params.id)
      .query('SELECT * FROM Interviews WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching interview:', err);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Create interview
app.post('/api/interviews', async (req, res) => {
  const { candidateId, candidateName, position, scheduleDate, interviewType } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('candidateId', candidateId)
      .input('candidateName', candidateName)
      .input('position', position)
      .input('scheduleDate', scheduleDate)
      .input('interviewType', interviewType)
      .query(`
        INSERT INTO Interviews (candidateId, candidateName, position, scheduleDate, interviewType, status)
        OUTPUT INSERTED.*
        VALUES (@candidateId, @candidateName, @position, @scheduleDate, @interviewType, 'scheduled')
      `);
    
    res.status(201).json({ success: true, interview: result.recordset[0] });
  } catch (err) {
    console.error('Error creating interview:', err);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
app.put('/api/interviews/:id', async (req, res) => {
  const { scheduleDate, interviewType, status, feedback } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .input('scheduleDate', scheduleDate)
      .input('interviewType', interviewType)
      .input('status', status)
      .input('feedback', feedback)
      .query(`
        UPDATE Interviews 
        SET scheduleDate = @scheduleDate, interviewType = @interviewType,
            status = @status, feedback = @feedback
        WHERE id = @id
      `);
    
    res.json({ success: true, message: 'Interview updated successfully' });
  } catch (err) {
    console.error('Error updating interview:', err);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
app.delete('/api/interviews/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Interviews WHERE id = @id');
    
    res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (err) {
    console.error('Error deleting interview:', err);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('UPDATE Notifications SET isRead = 1 WHERE id = @id');
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Get database tables
app.get('/api/database/tables', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        t.name AS TableName,
        SUM(p.rows) AS [RowCount]
      FROM sys.tables t
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      WHERE p.index_id IN (0,1)
      GROUP BY t.name
      ORDER BY t.name
    `);
    
    res.json({
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER,
      tables: result.recordset
    });
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WinWire ATS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
  try {
    // Initialize database connection and tables
    await initializeDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 WinWire ATS Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
