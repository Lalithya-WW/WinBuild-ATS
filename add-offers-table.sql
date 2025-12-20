-- Add Offers table to the database
-- Date: December 20, 2025

-- =============================================
-- Offers Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Offers' AND xtype='U')
BEGIN
    CREATE TABLE Offers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        candidateId INT,
        candidateName NVARCHAR(255) NOT NULL,
        jobTitle NVARCHAR(255) NOT NULL,
        department NVARCHAR(255),
        reportingManager NVARCHAR(255),
        startDate DATE,
        baseSalary DECIMAL(18, 2),
        signingBonus DECIMAL(18, 2),
        equityShares INT,
        vacationDays INT,
        healthBenefits NVARCHAR(500),
        workArrangement NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'draft',
        acceptedDate DATETIME,
        createdBy INT,
        updatedBy INT,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (candidateId) REFERENCES Candidates(id),
        FOREIGN KEY (createdBy) REFERENCES Users(id),
        FOREIGN KEY (updatedBy) REFERENCES Users(id)
    );
    PRINT 'Offers table created successfully';
END
GO

-- Add index for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Offers_CandidateId')
    CREATE INDEX IX_Offers_CandidateId ON Offers(candidateId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Offers_Status')
    CREATE INDEX IX_Offers_Status ON Offers(status);

PRINT 'Offers table indexes created successfully';
GO

-- Insert sample data
IF NOT EXISTS (SELECT * FROM Offers WHERE id = 1)
BEGIN
    -- First, let's make sure we have a candidate
    IF NOT EXISTS (SELECT * FROM Candidates WHERE name = 'Sarah Johnson')
    BEGIN
        INSERT INTO Candidates (name, email, phone, position, status)
        VALUES ('Sarah Johnson', 'sarah@email.com', '+1 (234) 567-8901', 'Senior Software Engineer', 'active');
    END

    DECLARE @candidateId INT;
    SELECT @candidateId = id FROM Candidates WHERE name = 'Sarah Johnson';

    INSERT INTO Offers (
        candidateId,
        candidateName,
        jobTitle,
        department,
        reportingManager,
        startDate,
        baseSalary,
        signingBonus,
        equityShares,
        vacationDays,
        healthBenefits,
        workArrangement,
        status,
        acceptedDate
    )
    VALUES (
        @candidateId,
        'Sarah Johnson',
        'Senior Software Engineer',
        'Engineering',
        'John Smith',
        '2026-01-15',
        120000,
        10000,
        5000,
        20,
        'Premium Coverage',
        'Hybrid (3 days/week)',
        'accepted',
        '2025-12-18'
    );
    
    PRINT 'Sample offer data inserted';
END
GO

PRINT 'Offers table setup completed successfully!';
GO
