# Interview Feedback Feature

## Overview

The Interview Feedback feature provides a structured interface for providing feedback on candidate interviews. It uses the Adzuna Jobs API as a data source to populate interview listings.

## Features

### 1. Interview Selection

- Dropdown to select from available interviews
- Displays candidate name, position, and interview date/time
- Interview data is fetched from Adzuna Jobs API

### 2. Evaluation Criteria

Rate candidates on a 5-star scale across multiple dimensions:

- **Technical Skills** - Programming knowledge, technical expertise, and problem-solving abilities
- **Communication** - Clarity of thought, articulation, and listening skills
- **Problem Solving** - Analytical thinking, creativity, and approach to challenges
- **Culture Fit** - Alignment with company values and team dynamics
- **Overall Rating** - Your overall impression of the candidate (Required)

### 3. Detailed Feedback

Provide text feedback in three areas:

- **Key Strengths** - What the candidate did particularly well
- **Areas of Concern** - What areas need improvement or red flags
- **Additional Comments** - Any other observations (Optional)

### 4. Final Recommendation

Choose one of two options:

- **Recommend to Hire** - Move candidate forward in the process
- **Do Not Recommend** - Candidate not suitable for this role

## API Integration

### Data Source

The feature uses the Adzuna Jobs API to fetch job listings and transforms them into interview data:

- **API Endpoint**: `https://api.adzuna.com/v1/api/jobs/in/search/1`
- **Parameters**:
  - `app_id`: 17d79c26
  - `app_key`: eda0bf8d8c2f0f2581b576d038ec09c1
  - `what`: nodejs
  - `where`: Hyderabad

### Backend Routes

Located in: `backend/Interview Feedback/interviewFeedbackRoutes.js`

1. **GET /api/interview-feedback/interviews**

   - Fetches all available interviews
   - Transforms Adzuna job data into interview format
   - Returns array of interview objects

2. **GET /api/interview-feedback/interviews/:id**

   - Fetches a specific interview by ID
   - Returns single interview object

3. **POST /api/interview-feedback/feedback**

   - Submits feedback for an interview
   - Required fields: interviewId, overallRating, recommendation
   - Returns success confirmation

4. **GET /api/interview-feedback/feedbacks**
   - Retrieves all submitted feedbacks
   - Currently returns empty array (placeholder for database integration)

## Frontend Component

### Location

- Component: `frontend/src/components/InterviewFeedback.js`
- Styles: `frontend/src/components/InterviewFeedback.css`

### Key Features

- Responsive star rating system
- Form validation for required fields
- Clear form functionality
- Loading states
- Real-time API integration

### Usage

The Interview Feedback tab is accessible from the main navigation in the ATS application. Click on "Interview Feedback" to access the feature.

## Installation & Setup

### Prerequisites

- Node.js installed
- Backend and frontend servers running
- Internet connection (for Adzuna API)

### Backend Setup

The routes are automatically registered in `server.js`:

```javascript
const interviewFeedbackRoutes = require("./Interview Feedback/interviewFeedbackRoutes");
app.use("/api/interview-feedback", interviewFeedbackRoutes);
```

### Frontend Setup

The component is imported and integrated in `App.js`:

```javascript
import InterviewFeedback from "./components/InterviewFeedback";
```

## Testing

### Access the Feature

1. Start the backend server: `cd backend && node server.js`
2. Start the frontend server: `cd frontend && npm start`
3. Navigate to http://localhost:3000
4. Click on the "Interview Feedback" tab

### Test Scenarios

1. **View Interviews**: Check that interviews load from the API
2. **Select Interview**: Choose different interviews from the dropdown
3. **Rate Candidate**: Click on stars to provide ratings
4. **Provide Feedback**: Enter text in all feedback fields
5. **Make Recommendation**: Select hire/reject recommendation
6. **Submit**: Submit the feedback form
7. **Clear Form**: Test the clear form functionality

## Future Enhancements

1. Database integration for storing feedback
2. View historical feedback for candidates
3. Aggregate feedback from multiple interviewers
4. PDF export of feedback reports
5. Email notifications when feedback is submitted
6. Analytics dashboard for interview insights

## Notes

- The Overall Rating and Final Recommendation fields are marked as required
- All star ratings can be updated by clicking on the stars
- The form can be cleared at any time using the "Clear Form" button
- Interview data refreshes when changing the selected interview
