-- =============================================
-- WinBuild ATS - Azure SQL Database Deployment Script
-- Azure AD SSO Integration with Azure Blob Storage
-- Date: December 20, 2025
-- =============================================
-- Instructions:
-- 1. Connect to your Azure SQL Database in SSMS or Azure Data Studio
-- 2. Replace 'YourDatabaseName' with your actual database name
-- 3. Execute this script
-- =============================================

USE [YourDatabaseName];
GO

SET NOCOUNT ON;
PRINT '========================================';
PRINT 'WinBuild ATS Database Deployment';
PRINT '========================================';
PRINT '';

-- =============================================
-- STEP 1: Create Tables
-- =============================================

PRINT 'STEP 1: Creating Tables...';
PRINT '';

-- Users Table (Azure AD Integration)
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
    PRINT '✓ Users table created';
END
ELSE
    PRINT '○ Users table already exists';
GO

-- Jobs Table
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
    PRINT '✓ Jobs table created';
END
ELSE
    PRINT '○ Jobs table already exists';
GO

-- Candidates Table (with Azure Blob Storage URL support)
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
    PRINT '✓ Candidates table created (with Azure Storage support)';
END
ELSE
BEGIN
    -- Check if resumePath column needs to be expanded
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Candidates' 
        AND COLUMN_NAME = 'resumePath' 
        AND CHARACTER_MAXIMUM_LENGTH < 1000
    )
    BEGIN
        ALTER TABLE Candidates ALTER COLUMN resumePath NVARCHAR(1000);
        PRINT '✓ Candidates.resumePath column expanded to support Azure Blob URLs';
    END
    ELSE
        PRINT '○ Candidates table already exists';
END
GO

-- Interviews Table
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
    PRINT '✓ Interviews table created';
END
ELSE
    PRINT '○ Interviews table already exists';
GO

-- Activities Table
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
    PRINT '✓ Activities table created';
END
ELSE
    PRINT '○ Activities table already exists';
GO

-- Notifications Table
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
    PRINT '✓ Notifications table created';
END
ELSE
    PRINT '○ Notifications table already exists';
GO

PRINT '';
PRINT 'STEP 2: Creating Indexes...';
PRINT '';

-- Create indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_AzureId')
BEGIN
    CREATE INDEX IX_Users_AzureId ON Users(azureId);
    PRINT '✓ Index created on Users.azureId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Candidates_Email')
BEGIN
    CREATE INDEX IX_Candidates_Email ON Candidates(email);
    PRINT '✓ Index created on Candidates.email';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Interviews_CandidateId')
BEGIN
    CREATE INDEX IX_Interviews_CandidateId ON Interviews(candidateId);
    PRINT '✓ Index created on Interviews.candidateId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Interviews_ScheduleDate')
BEGIN
    CREATE INDEX IX_Interviews_ScheduleDate ON Interviews(scheduleDate);
    PRINT '✓ Index created on Interviews.scheduleDate';
END

GO

PRINT '';
PRINT 'STEP 3: Creating Views...';
PRINT '';

-- Active Candidates View
IF OBJECT_ID('vw_ActiveCandidates', 'V') IS NOT NULL
    DROP VIEW vw_ActiveCandidates;
GO

CREATE VIEW vw_ActiveCandidates AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.position,
    c.resumePath AS resumeUrl,
    CASE 
        WHEN c.resumePath IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS hasResume,
    c.createdAt,
    u.name AS createdByName
FROM Candidates c
LEFT JOIN Users u ON c.createdBy = u.id
WHERE c.status = 'active';
GO
PRINT '✓ View vw_ActiveCandidates created';

-- Upcoming Interviews View
IF OBJECT_ID('vw_UpcomingInterviews', 'V') IS NOT NULL
    DROP VIEW vw_UpcomingInterviews;
GO

CREATE VIEW vw_UpcomingInterviews AS
SELECT 
    i.id,
    i.candidateName,
    i.position,
    i.scheduleDate,
    i.interviewType,
    i.status,
    c.email AS candidateEmail,
    c.phone AS candidatePhone,
    c.resumePath AS candidateResume
FROM Interviews i
LEFT JOIN Candidates c ON i.candidateId = c.id
WHERE i.status IN ('scheduled', 'confirmed')
    AND i.scheduleDate >= GETDATE();
GO
PRINT '✓ View vw_UpcomingInterviews created';

GO

PRINT '';
PRINT 'STEP 4: Creating Stored Procedures...';
PRINT '';

-- Stored Procedure: Upload Resume (stores Azure Blob Storage URL)
IF OBJECT_ID('sp_UploadResume', 'P') IS NOT NULL
    DROP PROCEDURE sp_UploadResume;
GO

CREATE PROCEDURE sp_UploadResume
    @CandidateId INT,
    @ResumeUrl NVARCHAR(1000),
    @UpdatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Candidates
    SET resumePath = @ResumeUrl,
        updatedBy = @UpdatedBy,
        updatedAt = GETDATE()
    WHERE id = @CandidateId;
    
    -- Log activity
    INSERT INTO Activities (type, title, description, icon, createdBy, createdAt)
    VALUES (
        'resume_upload',
        'Resume Uploaded',
        'Resume uploaded for candidate ID: ' + CAST(@CandidateId AS NVARCHAR(10)),
        '📄',
        @UpdatedBy,
        GETDATE()
    );
    
    SELECT 
        id,
        name,
        email,
        resumePath,
        updatedAt
    FROM Candidates
    WHERE id = @CandidateId;
END
GO
PRINT '✓ Stored procedure sp_UploadResume created';

-- Stored Procedure: Create Candidate with Resume
IF OBJECT_ID('sp_CreateCandidateWithResume', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateCandidateWithResume;
GO

CREATE PROCEDURE sp_CreateCandidateWithResume
    @Name NVARCHAR(255),
    @Email NVARCHAR(255) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @Position NVARCHAR(255),
    @ResumeUrl NVARCHAR(1000) = NULL,
    @CreatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CandidateId INT;
    
    INSERT INTO Candidates (name, email, phone, position, resumePath, createdBy, updatedBy, createdAt, updatedAt)
    VALUES (@Name, @Email, @Phone, @Position, @ResumeUrl, @CreatedBy, @CreatedBy, GETDATE(), GETDATE());
    
    SET @CandidateId = SCOPE_IDENTITY();
    
    -- Log activity
    INSERT INTO Activities (type, title, description, icon, createdBy, createdAt)
    VALUES (
        'candidate_added',
        'New Candidate Added',
        @Name + ' applied for ' + @Position,
        '👤',
        @CreatedBy,
        GETDATE()
    );
    
    SELECT 
        id,
        name,
        email,
        phone,
        position,
        resumePath,
        createdAt
    FROM Candidates
    WHERE id = @CandidateId;
END
GO
PRINT '✓ Stored procedure sp_CreateCandidateWithResume created';

-- Stored Procedure: Get Candidate Resume URL
IF OBJECT_ID('sp_GetCandidateResume', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetCandidateResume;
GO

CREATE PROCEDURE sp_GetCandidateResume
    @CandidateId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        name,
        resumePath AS resumeUrl,
        CASE 
            WHEN resumePath IS NOT NULL THEN 1
            ELSE 0
        END AS hasResume
    FROM Candidates
    WHERE id = @CandidateId;
END
GO
PRINT '✓ Stored procedure sp_GetCandidateResume created';

GO

PRINT '';
PRINT '========================================';
PRINT 'Database Deployment Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '- Tables created with Azure AD integration';
PRINT '- Candidates.resumePath supports Azure Blob Storage URLs (up to 1000 chars)';
PRINT '- Audit trail columns (createdBy/updatedBy) on all tables';
PRINT '- Indexes created for performance';
PRINT '- Views created for common queries';
PRINT '- Stored procedures created for resume management';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Configure Azure Storage connection in backend/.env';
PRINT '2. Update frontend to use resume upload component';
PRINT '3. Test file upload to Azure Blob Storage';
PRINT '';

-- Display table statistics
SELECT 
    t.name AS TableName,
    p.rows AS [RowCount]
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE t.name IN ('Users', 'Jobs', 'Candidates', 'Interviews', 'Activities', 'Notifications')
    AND p.index_id IN (0,1)
ORDER BY t.name;

SET NOCOUNT OFF;
