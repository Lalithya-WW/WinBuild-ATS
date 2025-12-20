# Database Deployment & Azure Storage Integration Guide

## Overview
This guide covers deploying the WinBuild ATS database to Azure SQL and configuring Azure Blob Storage for resume uploads.

## Database Deployment

### Option 1: Deploy New Database
Run the comprehensive deployment script:
```sql
-- File: deploy-database.sql
-- Location: Root of project
-- Execute in: Azure Data Studio or SSMS
```

**Steps:**
1. Connect to your Azure SQL Database
2. Open `deploy-database.sql`
3. Replace `YourDatabaseName` with your actual database name (line 13)
4. Execute the script
5. Verify completion messages

### Option 2: Reset Existing Database
If you need to drop and recreate all tables:
```sql
-- File: database-reset.sql
-- ⚠️ WARNING: This will delete all data!
```

### Option 3: Setup Without Dropping Tables
If tables already exist and you just need to ensure schema:
```sql
-- File: database-setup.sql
-- Safe to run multiple times (uses IF NOT EXISTS)
```

## Database Schema

### Key Tables with Azure Storage Support

#### Candidates Table
```sql
CREATE TABLE Candidates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(50),
    position NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'active',
    resumePath NVARCHAR(1000), -- Azure Blob Storage URL ✓
    createdBy INT,
    updatedBy INT,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
```

**Resume Storage:**
- `resumePath` stores the full Azure Blob Storage URL
- Example: `https://winbuildats.blob.core.windows.net/resumes/2025-12-20-abc123.pdf`
- Max length: 1000 characters (sufficient for Azure Blob URLs)

### Audit Trail Columns
All tables (except Users) have audit tracking:
- `createdBy` - User ID who created the record
- `updatedBy` - User ID who last updated the record
- `createdAt` - Timestamp of creation
- `updatedAt` - Timestamp of last update

## Azure Blob Storage Configuration

### Backend Configuration (.env)
```env
# Azure Storage Account
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=winbuildats;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=resumes
```

### Resume Upload Flow

1. **Frontend:** User uploads file via ResumeUpload component
2. **Backend API:** POST `/api/resumes/upload`
   - Validates file type (PDF, DOC, DOCX)
   - Validates file size (max 10MB)
   - Generates unique blob name with timestamp
3. **Azure Storage:** File uploaded to `resumes` container
4. **Database:** Resume URL saved to `Candidates.resumePath`
5. **Activity Log:** Upload activity recorded

### Stored Procedures for Resume Management

#### Upload Resume to Existing Candidate
```sql
EXEC sp_UploadResume 
    @CandidateId = 123,
    @ResumeUrl = 'https://winbuildats.blob.core.windows.net/resumes/2025-12-20-resume.pdf',
    @UpdatedBy = 1;
```

#### Create New Candidate with Resume
```sql
EXEC sp_CreateCandidateWithResume
    @Name = 'John Doe',
    @Email = 'john@email.com',
    @Phone = '555-0123',
    @Position = 'Senior Developer',
    @ResumeUrl = 'https://winbuildats.blob.core.windows.net/resumes/john-resume.pdf',
    @CreatedBy = 1;
```

#### Get Candidate Resume URL
```sql
EXEC sp_GetCandidateResume @CandidateId = 123;
```

## API Endpoints

### Resume Upload
```http
POST /api/resumes/upload
Content-Type: multipart/form-data

Body:
- resume: [file]
- candidateName: string
- email: string (optional)
- phone: string (optional)
- position: string
```

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "candidate": {
    "id": 123,
    "name": "John Doe",
    "email": "john@email.com",
    "resumePath": "https://winbuildats.blob.core.windows.net/resumes/2025-12-20-abc123.pdf"
  }
}
```

### Get Resume URL
```http
GET /api/resumes/:candidateId/resume
```

**Response:**
```json
{
  "success": true,
  "resumeUrl": "https://winbuildats.blob.core.windows.net/resumes/2025-12-20-abc123.pdf"
}
```

### Delete Resume
```http
DELETE /api/resumes/:candidateId/resume
```

## Database Views

### Active Candidates with Resume Status
```sql
SELECT * FROM vw_ActiveCandidates;
```
Columns: id, name, email, phone, position, resumeUrl, hasResume, createdAt, createdByName

### Upcoming Interviews with Candidate Resumes
```sql
SELECT * FROM vw_UpcomingInterviews;
```
Columns: id, candidateName, position, scheduleDate, interviewType, status, candidateEmail, candidatePhone, candidateResume

## Indexes

Performance indexes created:
- `IX_Users_AzureId` - Fast Azure AD lookups
- `IX_Candidates_Email` - Fast candidate searches
- `IX_Interviews_CandidateId` - Fast interview queries
- `IX_Interviews_ScheduleDate` - Fast date range queries

## Verification Queries

### Check Resume Storage Status
```sql
SELECT 
    COUNT(*) AS TotalCandidates,
    COUNT(resumePath) AS CandidatesWithResume,
    COUNT(*) - COUNT(resumePath) AS CandidatesWithoutResume,
    CAST(COUNT(resumePath) * 100.0 / COUNT(*) AS DECIMAL(5,2)) AS ResumePercentage
FROM Candidates;
```

### List Candidates with Azure Blob Resumes
```sql
SELECT 
    id,
    name,
    email,
    position,
    resumePath,
    createdAt
FROM Candidates
WHERE resumePath IS NOT NULL
    AND resumePath LIKE 'https://%.blob.core.windows.net/%'
ORDER BY createdAt DESC;
```

### Recent Resume Uploads
```sql
SELECT TOP 10
    a.title,
    a.description,
    a.createdAt,
    u.name AS uploadedBy
FROM Activities a
LEFT JOIN Users u ON a.createdBy = u.id
WHERE a.type = 'resume_upload'
ORDER BY a.createdAt DESC;
```

## Troubleshooting

### Database Connection Issues
1. Check Azure SQL firewall rules
2. Verify connection string in `.env`
3. Ensure database exists and user has permissions

### Azure Storage Issues
1. Verify storage account connection string
2. Check if `resumes` container exists (auto-created if not)
3. Verify storage account key is valid
4. Check Azure Storage firewall settings

### Resume Upload Failures
```sql
-- Check for failed uploads in recent activities
SELECT * FROM Activities
WHERE type = 'error'
    AND description LIKE '%resume%'
ORDER BY createdAt DESC;
```

## Security Best Practices

1. **Connection Strings:** Never commit `.env` file to git
2. **Storage Keys:** Rotate Azure Storage keys regularly
3. **Access Control:** Use Azure AD authentication for database
4. **Blob Access:** Consider using SAS tokens instead of public access
5. **File Validation:** Always validate file types and sizes

## Migration from Local Storage

If migrating from local file storage:

```sql
-- Update existing resumePath to Azure Blob URLs
UPDATE Candidates
SET resumePath = 'https://winbuildats.blob.core.windows.net/resumes/' + 
                 SUBSTRING(resumePath, CHARINDEX('resumes/', resumePath) + 8, 1000)
WHERE resumePath IS NOT NULL
    AND resumePath NOT LIKE 'https://%';
```

## Support

For issues or questions:
1. Check application logs in backend console
2. Review Azure SQL Database query logs
3. Check Azure Storage account metrics
4. Verify environment variables are loaded correctly
