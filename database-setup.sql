-- WinWire ATS Database Setup Script
-- Azure AD SSO Integration
-- Date: December 20, 2025

-- =============================================
-- Users Table (Azure AD Integration)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
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
    PRINT 'Users table created successfully';
END
GO

-- =============================================
-- Jobs Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Jobs' AND xtype='U')
BEGIN
    CREATE TABLE Jobs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        department NVARCHAR(255),
        location NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'open',
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (createdBy) REFERENCES Users(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );
    PRINT 'Jobs table created successfully';
END
GO

-- =============================================
-- Candidates Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Candidates' AND xtype='U')
BEGIN
    CREATE TABLE Candidates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(50),
        position NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'active',
        resumePath NVARCHAR(1000), -- Azure Blob Storage URL
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (createdBy) REFERENCES Users(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );
    PRINT 'Candidates table created successfully';
END
GO

-- =============================================
-- Interviews Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Interviews' AND xtype='U')
BEGIN
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
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (candidateId) REFERENCES Candidates(id),
        FOREIGN KEY (createdBy) REFERENCES Users(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );
    PRINT 'Interviews table created successfully';
END
GO

-- =============================================
-- Activities Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Activities' AND xtype='U')
BEGIN
    CREATE TABLE Activities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        icon NVARCHAR(50),
        createdBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (createdBy) REFERENCES Users(id)
    );
    PRINT 'Activities table created successfully';
END
GO

-- =============================================
-- Notifications Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
BEGIN
    CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        priority NVARCHAR(20) DEFAULT 'medium',
        isRead BIT DEFAULT 0,
        createdBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (createdBy) REFERENCES Users(id)
    );
    PRINT 'Notifications table created successfully';
END
GO

-- =============================================
-- Sample Data Insertion
-- =============================================

-- Insert sample jobs
IF NOT EXISTS (SELECT * FROM Jobs)
BEGIN
    INSERT INTO Jobs (title, department, location, status)
    VALUES 
        ('Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'open'),
        ('Product Manager', 'Product', 'New York, NY', 'open'),
        ('UX Designer', 'Design', 'Remote', 'open'),
        ('Technical Writer', 'Documentation', 'Austin, TX', 'open'),
        ('Data Scientist', 'Analytics', 'Seattle, WA', 'open');
    PRINT 'Sample jobs inserted';
END
GO

-- Insert sample candidates
IF NOT EXISTS (SELECT * FROM Candidates)
BEGIN
    INSERT INTO Candidates (name, email, phone, position, status)
    VALUES 
        ('Sarah Johnson', 'sarah.j@email.com', '555-0101', 'Senior Software Engineer', 'active'),
        ('Michael Chen', 'michael.c@email.com', '555-0102', 'Technical Round', 'active'),
        ('Emily Davis', 'emily.d@email.com', '555-0103', 'Final Round', 'active'),
        ('Alex Martinez', 'alex.m@email.com', '555-0104', 'Product Manager', 'active'),
        ('Robert Kim', 'robert.k@email.com', '555-0105', 'UX Designer', 'active'),
        ('Lisa Anderson', 'lisa.a@email.com', '555-0106', 'Data Scientist', 'active');
    PRINT 'Sample candidates inserted';
END
GO

-- Insert sample activities
IF NOT EXISTS (SELECT * FROM Activities)
BEGIN
    INSERT INTO Activities (type, title, description, icon)
    VALUES 
        ('application', 'New Application Received', 'Sarah Johnson applied for Senior Software Engineer', 'user-plus'),
        ('interview', 'Interview Scheduled', 'Michael Chen - Technical Round on Dec 20, 2:00 PM', 'calendar'),
        ('status', 'Status Update', 'Emily Davis moved to "Final Round"', 'arrow-right'),
        ('offer', 'Offer Extended', 'Job offer sent to Alex Martinez - Product Manager', 'check-circle'),
        ('application', 'New Application Received', 'Robert Kim applied for UX Designer', 'user-plus');
    PRINT 'Sample activities inserted';
END
GO

-- Insert sample notifications
IF NOT EXISTS (SELECT * FROM Notifications)
BEGIN
    INSERT INTO Notifications (type, title, description, priority, isRead)
    VALUES 
        ('feedback', 'Pending Interview Feedback', '3 interviews needing your feedback', 'high', 0),
        ('interview', 'Interview Starting Soon', 'Technical Interview with John Doe at 2:00 PM', 'medium', 0),
        ('approval', 'Offer Approval Required', '2 job offers pending manager approval', 'high', 0);
    PRINT 'Sample notifications inserted';
END
GO

-- Insert sample interviews
IF NOT EXISTS (SELECT * FROM Interviews)
BEGIN
    INSERT INTO Interviews (candidateName, position, scheduleDate, interviewType, status)
    VALUES 
        ('John Doe', 'Senior Software Engineer', DATEADD(hour, 2, GETDATE()), 'Technical Round', 'scheduled'),
        ('Jane Smith', 'Product Manager', DATEADD(day, 1, GETDATE()), 'Final Round', 'scheduled'),
        ('Mike Wilson', 'UX Designer', GETDATE(), 'Phone Screen', 'completed');
    PRINT 'Sample interviews inserted';
END
GO

-- =============================================
-- Indexes for Performance
-- =============================================

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
    CREATE INDEX IX_Users_Email ON Users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_AzureId')
    CREATE INDEX IX_Users_AzureId ON Users(azureId);

-- Jobs table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Jobs_Status')
    CREATE INDEX IX_Jobs_Status ON Jobs(status);

-- Candidates table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Candidates_Status')
    CREATE INDEX IX_Candidates_Status ON Candidates(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Candidates_Email')
    CREATE INDEX IX_Candidates_Email ON Candidates(email);

-- Interviews table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Interviews_ScheduleDate')
    CREATE INDEX IX_Interviews_ScheduleDate ON Interviews(scheduleDate);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Interviews_Status')
    CREATE INDEX IX_Interviews_Status ON Interviews(status);

-- Notifications table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead')
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);

PRINT 'Indexes created successfully';
GO

-- =============================================
-- Views for Common Queries
-- =============================================

-- View: Active Jobs with Application Count
IF OBJECT_ID('vw_ActiveJobs', 'V') IS NOT NULL
    DROP VIEW vw_ActiveJobs;
GO

CREATE VIEW vw_ActiveJobs AS
SELECT 
    j.id,
    j.title,
    j.department,
    j.location,
    j.status,
    j.createdAt,
    COUNT(c.id) as applicantCount
FROM Jobs j
LEFT JOIN Candidates c ON j.title = c.position
WHERE j.status = 'open'
GROUP BY j.id, j.title, j.department, j.location, j.status, j.createdAt;
GO

-- View: Today's Scheduled Interviews
IF OBJECT_ID('vw_TodaysInterviews', 'V') IS NOT NULL
    DROP VIEW vw_TodaysInterviews;
GO

CREATE VIEW vw_TodaysInterviews AS
SELECT 
    id,
    candidateName,
    position,
    scheduleDate,
    interviewType,
    status
FROM Interviews
WHERE CAST(scheduleDate AS DATE) = CAST(GETDATE() AS DATE)
AND status = 'scheduled';
GO

-- View: Recent Activities (Last 30 days)
IF OBJECT_ID('vw_RecentActivities', 'V') IS NOT NULL
    DROP VIEW vw_RecentActivities;
GO

CREATE VIEW vw_RecentActivities AS
SELECT TOP 50
    id,
    type,
    title,
    description,
    icon,
    createdAt,
    CASE 
        WHEN DATEDIFF(MINUTE, createdAt, GETDATE()) < 1 THEN 'Just now'
        WHEN DATEDIFF(MINUTE, createdAt, GETDATE()) < 60 THEN CAST(DATEDIFF(MINUTE, createdAt, GETDATE()) AS VARCHAR) + ' minutes ago'
        WHEN DATEDIFF(HOUR, createdAt, GETDATE()) < 24 THEN CAST(DATEDIFF(HOUR, createdAt, GETDATE()) AS VARCHAR) + ' hours ago'
        ELSE CAST(DATEDIFF(DAY, createdAt, GETDATE()) AS VARCHAR) + ' days ago'
    END as timeAgo
FROM Activities
WHERE createdAt >= DATEADD(day, -30, GETDATE())
ORDER BY createdAt DESC;
GO

PRINT 'Views created successfully';
GO

-- =============================================
-- Stored Procedures
-- =============================================

-- SP: Get Dashboard Statistics
IF OBJECT_ID('sp_GetDashboardStats', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetDashboardStats;
GO

CREATE PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Jobs WHERE status = 'open') as openJobs,
        (SELECT COUNT(*) FROM Candidates WHERE status = 'active') as activeCandidates,
        (SELECT COUNT(*) FROM Interviews WHERE CAST(scheduleDate AS DATE) = CAST(GETDATE() AS DATE) AND status = 'scheduled') as interviewsToday,
        (SELECT COUNT(*) FROM Notifications WHERE isRead = 0) as unreadNotifications,
        (SELECT COUNT(*) FROM Users) as totalUsers;
END
GO

-- SP: Upsert User (for Azure AD login)
IF OBJECT_ID('sp_UpsertUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpsertUser;
GO

CREATE PROCEDURE sp_UpsertUser
    @azureId NVARCHAR(255),
    @email NVARCHAR(255),
    @name NVARCHAR(255),
    @firstName NVARCHAR(100),
    @lastName NVARCHAR(100)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE azureId = @azureId)
    BEGIN
        -- Update existing user
        UPDATE Users 
        SET lastLogin = GETDATE(),
            updatedAt = GETDATE(),
            email = @email,
            name = @name,
            firstName = @firstName,
            lastName = @lastName
        WHERE azureId = @azureId;
    END
    ELSE
    BEGIN
        -- Insert new user
        INSERT INTO Users (azureId, email, name, firstName, lastName, role, lastLogin)
        VALUES (@azureId, @email, @name, @firstName, @lastName, 'Recruiter', GETDATE());
    END
    
    -- Return the user record
    SELECT * FROM Users WHERE azureId = @azureId;
END
GO

PRINT 'Stored procedures created successfully';
GO

-- =============================================
-- Script Complete
-- =============================================
PRINT '========================================';
PRINT 'Database setup completed successfully!';
PRINT 'Tables: Users, Jobs, Candidates, Interviews, Activities, Notifications';
PRINT 'Indexes: Created for performance optimization';
PRINT 'Views: vw_ActiveJobs, vw_TodaysInterviews, vw_RecentActivities';
PRINT 'Stored Procedures: sp_GetDashboardStats, sp_UpsertUser';
PRINT '========================================';
GO
