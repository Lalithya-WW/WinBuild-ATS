-- =============================================
-- DROP AND RECREATE ALL TABLES
-- WinWire ATS Database Reset Script
-- =============================================

USE [your-database-name];
GO

PRINT 'Starting database reset...';
GO

-- =============================================
-- DROP EXISTING TABLES
-- =============================================

IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Notifications;
    PRINT 'Dropped Notifications table';
END
GO

IF OBJECT_ID('dbo.Activities', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Activities;
    PRINT 'Dropped Activities table';
END
GO

IF OBJECT_ID('dbo.Interviews', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Interviews;
    PRINT 'Dropped Interviews table';
END
GO

IF OBJECT_ID('dbo.Candidates', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Candidates;
    PRINT 'Dropped Candidates table';
END
GO

IF OBJECT_ID('dbo.Jobs', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Jobs;
    PRINT 'Dropped Jobs table';
END
GO

IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Users;
    PRINT 'Dropped Users table';
END
GO

PRINT 'All tables dropped successfully';
GO

-- =============================================
-- CREATE TABLES
-- =============================================

-- Users Table (Azure AD Integration)
CREATE TABLE dbo.Users (
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
PRINT 'Created Users table';
GO

-- Jobs Table
CREATE TABLE dbo.Jobs (
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
PRINT 'Created Jobs table';
GO

-- Candidates Table
CREATE TABLE dbo.Candidates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(50),
    position NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'active',
    resumePath NVARCHAR(500),
    createdBy INT,
    updatedBy INT,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
PRINT 'Created Candidates table';
GO

-- Interviews Table
CREATE TABLE dbo.Interviews (
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
PRINT 'Created Interviews table';
GO

-- Activities Table
CREATE TABLE dbo.Activities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    icon NVARCHAR(50),
    createdBy INT,
    createdAt DATETIME DEFAULT GETDATE()
);
PRINT 'Created Activities table';
GO

-- Notifications Table
CREATE TABLE dbo.Notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    priority NVARCHAR(20) DEFAULT 'medium',
    isRead BIT DEFAULT 0,
    createdBy INT,
    createdAt DATETIME DEFAULT GETDATE()
);
PRINT 'Created Notifications table';
GO

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IX_Users_Email ON dbo.Users(email);
CREATE INDEX IX_Users_AzureId ON dbo.Users(azureId);
CREATE INDEX IX_Jobs_Status ON dbo.Jobs(status);
CREATE INDEX IX_Candidates_Status ON dbo.Candidates(status);
CREATE INDEX IX_Candidates_Email ON dbo.Candidates(email);
CREATE INDEX IX_Interviews_ScheduleDate ON dbo.Interviews(scheduleDate);
CREATE INDEX IX_Interviews_Status ON dbo.Interviews(status);
CREATE INDEX IX_Notifications_IsRead ON dbo.Notifications(isRead);

PRINT 'Created indexes';
GO

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- Sample Jobs
INSERT INTO dbo.Jobs (title, department, location, status)
VALUES 
    ('Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'open'),
    ('Product Manager', 'Product', 'New York, NY', 'open'),
    ('UX Designer', 'Design', 'Remote', 'open'),
    ('Technical Writer', 'Documentation', 'Austin, TX', 'open'),
    ('Data Scientist', 'Analytics', 'Seattle, WA', 'open'),
    ('DevOps Engineer', 'Infrastructure', 'Boston, MA', 'open');
PRINT 'Inserted sample jobs';
GO

-- Sample Candidates
INSERT INTO dbo.Candidates (name, email, phone, position, status)
VALUES 
    ('Sarah Johnson', 'sarah.j@email.com', '555-0101', 'Senior Software Engineer', 'active'),
    ('Michael Chen', 'michael.c@email.com', '555-0102', 'Product Manager', 'active'),
    ('Emily Davis', 'emily.d@email.com', '555-0103', 'UX Designer', 'active'),
    ('Alex Martinez', 'alex.m@email.com', '555-0104', 'Product Manager', 'active'),
    ('Robert Kim', 'robert.k@email.com', '555-0105', 'UX Designer', 'active'),
    ('Lisa Anderson', 'lisa.a@email.com', '555-0106', 'Data Scientist', 'active'),
    ('David Brown', 'david.b@email.com', '555-0107', 'DevOps Engineer', 'active'),
    ('Jessica White', 'jessica.w@email.com', '555-0108', 'Technical Writer', 'active');
PRINT 'Inserted sample candidates';
GO

-- Sample Activities
INSERT INTO dbo.Activities (type, title, description, icon)
VALUES 
    ('application', 'New Application Received', 'Sarah Johnson applied for Senior Software Engineer', 'user-plus'),
    ('interview', 'Interview Scheduled', 'Michael Chen - Technical Round on Dec 20, 2:00 PM', 'calendar'),
    ('status', 'Status Update', 'Emily Davis moved to "Final Round"', 'arrow-right'),
    ('offer', 'Offer Extended', 'Job offer sent to Alex Martinez - Product Manager', 'check-circle'),
    ('application', 'New Application Received', 'Robert Kim applied for UX Designer', 'user-plus'),
    ('interview', 'Interview Completed', 'Lisa Anderson completed Phone Screen', 'check-circle'),
    ('application', 'New Application Received', 'David Brown applied for DevOps Engineer', 'user-plus'),
    ('status', 'Status Update', 'Jessica White moved to "Interview Stage"', 'arrow-right');
PRINT 'Inserted sample activities';
GO

-- Sample Notifications
INSERT INTO dbo.Notifications (type, title, description, priority, isRead)
VALUES 
    ('feedback', 'Pending Interview Feedback', '3 interviews needing your feedback', 'high', 0),
    ('interview', 'Interview Starting Soon', 'Technical Interview with John Doe at 2:00 PM', 'medium', 0),
    ('approval', 'Offer Approval Required', '2 job offers pending manager approval', 'high', 0),
    ('reminder', 'Resume Review Needed', '5 new applications awaiting review', 'medium', 0);
PRINT 'Inserted sample notifications';
GO

-- Sample Interviews
INSERT INTO dbo.Interviews (candidateName, position, scheduleDate, interviewType, status)
VALUES 
    ('John Doe', 'Senior Software Engineer', DATEADD(hour, 2, GETDATE()), 'Technical Round', 'scheduled'),
    ('Jane Smith', 'Product Manager', DATEADD(day, 1, GETDATE()), 'Final Round', 'scheduled'),
    ('Mike Wilson', 'UX Designer', GETDATE(), 'Phone Screen', 'completed'),
    ('Sarah Johnson', 'Senior Software Engineer', DATEADD(day, 2, GETDATE()), 'Initial Screen', 'scheduled'),
    ('Lisa Anderson', 'Data Scientist', DATEADD(hour, -2, GETDATE()), 'Phone Screen', 'completed');
PRINT 'Inserted sample interviews';
GO

-- =============================================
-- VERIFY TABLES
-- =============================================

PRINT '========================================';
PRINT 'Database reset completed successfully!';
PRINT '';
PRINT 'Tables created:';
SELECT 
    t.name AS TableName,
    SUM(p.rows) AS [RowCount]
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
    AND t.name IN ('Users', 'Jobs', 'Candidates', 'Interviews', 'Activities', 'Notifications')
GROUP BY t.name
ORDER BY t.name;

PRINT '';
PRINT '========================================';
GO
