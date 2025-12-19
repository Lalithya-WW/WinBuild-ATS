const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function resetDatabase() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to Azure SQL Database');

    // Drop all foreign key constraints first
    console.log('Dropping foreign key constraints...');
    
    const fkQuery = `
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + 
                     QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
      FROM sys.foreign_keys;
      EXEC sp_executesql @sql;
    `;
    
    await pool.request().query(fkQuery);
    console.log('✅ Foreign keys dropped');
    
    // Drop existing tables in correct order (considering dependencies)
    console.log('Dropping existing tables...');
    
    await pool.request().query('IF EXISTS (SELECT * FROM sysobjects WHERE name=\'Interviews\' AND xtype=\'U\') DROP TABLE Interviews');
    await pool.request().query('IF EXISTS (SELECT * FROM sysobjects WHERE name=\'Notifications\' AND xtype=\'U\') DROP TABLE Notifications');
    await pool.request().query('IF EXISTS (SELECT * FROM sysobjects WHERE name=\'Activities\' AND xtype=\'U\') DROP TABLE Activities');
    await pool.request().query('IF EXISTS (SELECT * FROM sysobjects WHERE name=\'Candidates\' AND xtype=\'U\') DROP TABLE Candidates');
    await pool.request().query('IF EXISTS (SELECT * FROM sysobjects WHERE name=\'Jobs\' AND xtype=\'U\') DROP TABLE Jobs');
    
    console.log('✅ Tables dropped');

    // Create Jobs table
    await pool.request().query(`
      CREATE TABLE Jobs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        department NVARCHAR(255),
        location NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'open',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Jobs table created');

    // Create Candidates table
    await pool.request().query(`
      CREATE TABLE Candidates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(50),
        position NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'active',
        resumePath NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Candidates table created');

    // Create Interviews table
    await pool.request().query(`
      CREATE TABLE Interviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        candidateId INT,
        candidateName NVARCHAR(255),
        position NVARCHAR(255),
        scheduleDate DATETIME,
        interviewType NVARCHAR(100),
        status NVARCHAR(50) DEFAULT 'scheduled',
        feedback NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Interviews table created');

    // Create Activities table
    await pool.request().query(`
      CREATE TABLE Activities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        icon NVARCHAR(50),
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Activities table created');

    // Create Notifications table
    await pool.request().query(`
      CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        priority NVARCHAR(20) DEFAULT 'medium',
        isRead BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Notifications table created');

    // Insert sample data
    console.log('Inserting sample data...');

    // Jobs
    await pool.request().query(`
      INSERT INTO Jobs (title, department, location, status)
      VALUES 
        ('Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'open'),
        ('Product Manager', 'Product', 'New York, NY', 'open'),
        ('UX Designer', 'Design', 'Remote', 'open'),
        ('Technical Writer', 'Documentation', 'Austin, TX', 'open')
    `);
    console.log('✅ Jobs inserted');

    // Candidates
    await pool.request().query(`
      INSERT INTO Candidates (name, email, phone, position, status)
      VALUES 
        ('Sarah Johnson', 'sarah.j@email.com', '555-0101', 'Senior Software Engineer', 'active'),
        ('Michael Chen', 'michael.c@email.com', '555-0102', 'Technical Round', 'active'),
        ('Emily Davis', 'emily.d@email.com', '555-0103', 'Final Round', 'active'),
        ('Alex Martinez', 'alex.m@email.com', '555-0104', 'Product Manager', 'active'),
        ('Robert Kim', 'robert.k@email.com', '555-0105', 'UX Designer', 'active')
    `);
    console.log('✅ Candidates inserted');

    // Interviews
    await pool.request().query(`
      INSERT INTO Interviews (candidateName, position, scheduleDate, interviewType, status)
      VALUES 
        ('John Doe', 'Senior Software Engineer', DATEADD(hour, 2, GETDATE()), 'Technical Round', 'scheduled'),
        ('Jane Smith', 'Product Manager', DATEADD(day, 1, GETDATE()), 'Final Round', 'scheduled'),
        ('Mike Wilson', 'UX Designer', GETDATE(), 'Phone Screen', 'completed')
    `);
    console.log('✅ Interviews inserted');

    // Activities
    await pool.request().query(`
      INSERT INTO Activities (type, title, description, icon)
      VALUES 
        ('application', 'New Application Received', 'Sarah Johnson applied for Senior Software Engineer', 'user-plus'),
        ('interview', 'Interview Scheduled', 'Michael Chen - Technical Round on Dec 20, 2:00 PM', 'calendar'),
        ('status', 'Status Update', 'Emily Davis moved to "Final Round"', 'arrow-right'),
        ('offer', 'Offer Extended', 'Job offer sent to Alex Martinez - Product Manager', 'check-circle'),
        ('application', 'New Application Received', 'Robert Kim applied for UX Designer', 'user-plus')
    `);
    console.log('✅ Activities inserted');

    // Notifications
    await pool.request().query(`
      INSERT INTO Notifications (type, title, description, priority, isRead)
      VALUES 
        ('feedback', 'Pending Interview Feedback', '3 interviews needing your feedback', 'high', 0),
        ('interview', 'Interview Starting Soon', 'Technical Interview with John Doe at 2:00 PM', 'medium', 0),
        ('approval', 'Offer Approval Required', '2 job offers pending manager approval', 'high', 0)
    `);
    console.log('✅ Notifications inserted');

    console.log('\n🎉 Database reset complete! All tables created and populated with sample data.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

resetDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
