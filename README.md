# WinWire ATS - Applicant Tracking System

A full-stack web application for managing recruitment processes, built with React and Node.js.

## Features

- Dashboard with key metrics (Open Jobs, Active Candidates, Interviews)
- Quick Actions (Create Job, Upload Resume)
- Recent Activity Feed
- Real-time Notifications
- Interview Management
- Offer Approval Workflow

## Project Structure

```
Winbuild-ATS/
├── backend/          # Node.js Express API
│   ├── server.js     # Main server file
│   ├── routes/       # API routes
│   └── data/         # Mock data
└── frontend/         # React application
    ├── src/
    │   ├── components/  # React components
    │   ├── App.js       # Main app component
    │   └── index.js     # Entry point
    └── public/
```

## Setup Instructions

### Backend Setup

1. Navigate to backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:5001

### Frontend Setup

1. Navigate to frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   App runs on http://localhost:3000

## API Endpoints

- `GET /api/stats` - Dashboard statistics
- `GET /api/activities` - Recent activities
- `GET /api/notifications` - User notifications
- `POST /api/jobs` - Create new job
- `POST /api/resumes` - Upload resume

## Technology Stack

- **Frontend**: React, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express, CORS
- **Styling**: CSS3, Flexbox, Grid

## Demo Mode

The application includes demo data for testing purposes. All data is stored in memory and will reset on server restart.
