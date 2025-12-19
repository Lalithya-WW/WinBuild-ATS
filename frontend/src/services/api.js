import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Stats
export const getStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/stats`);
  return response.data;
};

// Activities
export const getActivities = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/activities`);
  return response.data;
};

// Notifications
export const getNotifications = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
  return response.data;
};

// User
export const getUser = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/user`);
  return response.data;
};

// Jobs
export const getJobs = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/jobs`);
  return response.data;
};

export const getJobById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/api/jobs/${id}`);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await axios.post(`${API_BASE_URL}/api/jobs`, jobData);
  return response.data;
};

export const updateJob = async (id, jobData) => {
  const response = await axios.put(`${API_BASE_URL}/api/jobs/${id}`, jobData);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/jobs/${id}`);
  return response.data;
};

// Candidates
export const getCandidates = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/candidates`);
  return response.data;
};

export const getCandidateById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/api/candidates/${id}`);
  return response.data;
};

export const createCandidate = async (candidateData) => {
  const response = await axios.post(`${API_BASE_URL}/api/resumes`, candidateData);
  return response.data;
};

export const updateCandidate = async (id, candidateData) => {
  const response = await axios.put(`${API_BASE_URL}/api/candidates/${id}`, candidateData);
  return response.data;
};

export const deleteCandidate = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/candidates/${id}`);
  return response.data;
};

// Interviews
export const getInterviews = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/interviews`);
  return response.data;
};

export const getInterviewById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/api/interviews/${id}`);
  return response.data;
};

export const createInterview = async (interviewData) => {
  const response = await axios.post(`${API_BASE_URL}/api/interviews`, interviewData);
  return response.data;
};

export const updateInterview = async (id, interviewData) => {
  const response = await axios.put(`${API_BASE_URL}/api/interviews/${id}`, interviewData);
  return response.data;
};

export const deleteInterview = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/interviews/${id}`);
  return response.data;
};

// Database
export const getDatabaseTables = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/database/tables`);
  return response.data;
};

export default {
  // Stats
  getStats,
  getActivities,
  getNotifications,
  markNotificationAsRead,
  getUser,
  
  // Jobs
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  
  // Candidates
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  
  // Interviews
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  
  // Database
  getDatabaseTables
};
