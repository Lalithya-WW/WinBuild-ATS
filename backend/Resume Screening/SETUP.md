# Resume Screening Setup Guide

## What's Been Created

### Backend Files (Resume Screening folder)

1. **resumeScreeningRoutes.js** - Express routes for:

   - Fetching jobs from Adzuna API
   - Handling resume PDF uploads
   - AI-powered screening simulation

2. **README.md** - Documentation for the feature

### Frontend Files

1. **ResumeScreening.js** - Main component with the UI from your design
2. **ResumeScreening.css** - Complete styling matching your design

### Integration

- Routes added to [backend/server.js](../backend/server.js#L16-L17)
- Component imported and routed in [frontend/src/App.js](../frontend/src/App.js)
- New "AI Resume Screening" tab added to the navigation

## How to Run

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The server runs on http://localhost:5000

### 2. Start the Frontend

```bash
cd frontend
npm start
```

The app runs on http://localhost:3000

### 3. Access the Feature

- Open http://localhost:3000 in your browser
- Click on the "AI Resume Screening" tab in the navigation
- You'll see the interface matching your design!

## How to Use

1. **Select a Position**: Choose from real Node.js jobs in Hyderabad fetched from Adzuna API
2. **Upload Resume**: Drag & drop or browse to upload a PDF file
3. **Screen**: Click "Screen Resume with AI" button
4. **View Results**: See the detailed analysis with:
   - Match score (percentage)
   - Smart extraction of candidate info
   - Detailed analysis with strengths and concerns
   - Skill matching results
   - Recommendations

## API Configuration

The feature uses Adzuna API with these credentials:

- **App ID**: 17d79c26
- **App Key**: eda0bf8d8c2f0f2581b576d038ec09c1
- **Endpoint**: https://api.adzuna.com/v1/api/jobs/in/search/1

You can modify the search parameters in the frontend component or API calls:

- `what`: Job keywords (default: "nodejs")
- `where`: Location (default: "Hyderabad")

## Notes

- The AI screening is currently simulated (returns mock analysis)
- Resume files are stored in `backend/Resume Screening/uploads/`
- Only PDF files are accepted (5MB max)
- The UI matches your design with gradient colors, icons, and responsive layout

## Next Steps (Optional)

To enhance the feature:

1. Install `pdf-parse` package to actually read PDF content
2. Integrate with a real AI/ML service for analysis
3. Store screening results in the database
4. Add screening history for users
