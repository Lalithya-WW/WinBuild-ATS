# AI Resume Screening Feature

This folder contains the backend implementation for the AI Resume Screening feature that integrates with the Adzuna Jobs API.

## Features

- **Job Position Selection**: Fetch real job listings from Adzuna API (currently configured for Node.js jobs in Hyderabad)
- **Resume Upload**: PDF file upload with drag-and-drop support
- **AI Screening**: Simulated AI-powered resume analysis and matching
- **Smart Extraction**: Extract candidate information from resumes
- **Detailed Analysis**: Provide skill matching, strengths, and recommendations

## API Endpoints

### GET `/api/resume-screening/jobs`

Fetch job positions from Adzuna API

**Query Parameters:**

- `what` (optional): Job keyword (default: 'nodejs')
- `where` (optional): Location (default: 'Hyderabad')
- `page` (optional): Page number (default: 1)

**Response:**

```json
{
  "success": true,
  "count": 100,
  "jobs": [
    {
      "id": "12345",
      "title": "Senior Software Engineer",
      "company": "Tech Company",
      "location": "Hyderabad",
      "description": "...",
      "requiredSkills": ["React", "Node.js", "TypeScript"]
    }
  ]
}
```

### GET `/api/resume-screening/jobs/:id`

Get a specific job by ID

### POST `/api/resume-screening/screen`

Upload and screen a resume against a job position

**Form Data:**

- `resume`: PDF file (required)
- `jobTitle`: String (required)
- `requiredSkills`: JSON string array (required)

**Response:**

```json
{
  "success": true,
  "result": {
    "matchScore": 85,
    "status": "Highly Recommended",
    "extraction": { ... },
    "analysis": { ... },
    "recommendations": [ ... ]
  }
}
```

## Setup

### 1. Install Required Dependencies

```bash
cd backend
npm install axios multer
```

### 2. Configure Environment Variables

The Adzuna API credentials are already included in the code:

- App ID: `17d79c26`
- App Key: `eda0bf8d8c2f0f2581b576d038ec09c1`

### 3. File Upload Directory

The system automatically creates an `uploads` folder in the Resume Screening directory to store uploaded PDFs.

## Integration

The routes are automatically integrated into the main server.js file at the path `/api/resume-screening`.

## Frontend Integration

The React component is located at:

- Component: `frontend/src/components/ResumeScreening.js`
- Styles: `frontend/src/components/ResumeScreening.css`

Access the feature through the "AI Resume Screening" tab in the main application.

## Future Enhancements

- Integrate actual PDF parsing library (e.g., pdf-parse)
- Add real AI/ML model for resume analysis
- Store screening results in database
- Add support for more job search parameters
- Implement user authentication for screening history
