const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

async function getConnection() {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await sql.connect(config);
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    const pool = await getConnection();
    
    // Create tables if they don't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        azureId NVARCHAR(255) UNIQUE NOT NULL,
        email NVARCHAR(255) NOT NULL,
        name NVARCHAR(255),
        firstName NVARCHAR(100),
        lastName NVARCHAR(100),
        role NVARCHAR(50) DEFAULT 'Recruiter',
        lastLogin DATETIME DEFAULT GETDATE(),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Jobs' AND xtype='U')
      CREATE TABLE Jobs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        department NVARCHAR(255),
        location NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'open',
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Candidates' AND xtype='U')
      CREATE TABLE Candidates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(50),
        position NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'active',
        resumePath NVARCHAR(1000),
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Interviews' AND xtype='U')
      CREATE TABLE Interviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        candidateId INT,
        candidateName NVARCHAR(255),
        position NVARCHAR(255),
        scheduleDate DATETIME,
        interviewType NVARCHAR(100),
        status NVARCHAR(50) DEFAULT 'scheduled',
        feedback NVARCHAR(MAX),
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Activities' AND xtype='U')
      CREATE TABLE Activities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        icon NVARCHAR(50),
        createdBy INT,
        createdAt DATETIME DEFAULT GETDATE()
      );
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
      CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        priority NVARCHAR(20) DEFAULT 'medium',
        isRead BIT DEFAULT 0,
        createdBy INT,
        createdAt DATETIME DEFAULT GETDATE()
      );
    `);

    console.log('✅ Database tables initialized');
    
    // Insert sample data if tables are empty
    await insertSampleData(pool);
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
}

async function insertSampleData(pool) {
  try {
    // Check if data already exists
    const jobCount = await pool.request().query('SELECT COUNT(*) as count FROM Jobs');
    
    if (jobCount.recordset[0].count === 0) {
      // Insert sample jobs
      await pool.request().query(`
        INSERT INTO Jobs (title, department, location, status)
        VALUES 
          ('Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'open'),
          ('Product Manager', 'Product', 'New York, NY', 'open'),
          ('UX Designer', 'Design', 'Remote', 'open'),
          ('Technical Writer', 'Documentation', 'Austin, TX', 'open')
      `);

      // Insert sample candidates
      await pool.request().query(`
        INSERT INTO Candidates (name, email, phone, position, status)
        VALUES 
          ('Sarah Johnson', 'sarah.j@email.com', '555-0101', 'Senior Software Engineer', 'active'),
          ('Michael Chen', 'michael.c@email.com', '555-0102', 'Technical Round', 'active'),
          ('Emily Davis', 'emily.d@email.com', '555-0103', 'Final Round', 'active'),
          ('Alex Martinez', 'alex.m@email.com', '555-0104', 'Product Manager', 'active'),
          ('Robert Kim', 'robert.k@email.com', '555-0105', 'UX Designer', 'active')
      `);

      // Insert sample activities
      await pool.request().query(`
        INSERT INTO Activities (type, title, description, icon)
        VALUES 
          ('application', 'New Application Received', 'Sarah Johnson applied for Senior Software Engineer', 'user-plus'),
          ('interview', 'Interview Scheduled', 'Michael Chen - Technical Round on Dec 20, 2:00 PM', 'calendar'),
          ('status', 'Status Update', 'Emily Davis moved to "Final Round"', 'arrow-right'),
          ('offer', 'Offer Extended', 'Job offer sent to Alex Martinez - Product Manager', 'check-circle'),
          ('application', 'New Application Received', 'Robert Kim applied for UX Designer', 'user-plus')
      `);

      // Insert sample notifications
      await pool.request().query(`
        INSERT INTO Notifications (type, title, description, priority, isRead)
        VALUES 
          ('feedback', 'Pending Interview Feedback', '3 interviews needing your feedback', 'high', 0),
          ('interview', 'Interview Starting Soon', 'Technical Interview with John Doe at 2:00 PM', 'medium', 0),
          ('approval', 'Offer Approval Required', '2 job offers pending manager approval', 'high', 0)
      `);

      // Insert sample interviews
      await pool.request().query(`
        INSERT INTO Interviews (candidateName, position, scheduleDate, interviewType, status)
        VALUES 
          ('John Doe', 'Senior Software Engineer', DATEADD(hour, 2, GETDATE()), 'Technical Round', 'scheduled'),
          ('Jane Smith', 'Product Manager', DATEADD(day, 1, GETDATE()), 'Final Round', 'scheduled'),
          ('Mike Wilson', 'UX Designer', GETDATE(), 'Phone Screen', 'completed')
      `);

      console.log('✅ Sample data inserted');
    }
  } catch (err) {
    console.error('❌ Sample data insertion failed:', err.message);
  }
}

module.exports = {
  getConnection,
  initializeDatabase,
  sql
};
