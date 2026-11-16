import axios from 'axios';

// When running with Vite proxy or production, relative '/api' works cleanly
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api';

export const api = {
  // Screen multiple resumes against one JD
  screenResumes: async (formData) => {
    const response = await axios.post(`${API_BASE_URL}/screen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Screen 1 resume against multiple JDs
  screenMultiJd: async (formData) => {
    const response = await axios.post(`${API_BASE_URL}/screen/multi-jd`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get historical screenings
  getCandidates: async (search = '') => {
    const params = search ? { search } : {};
    const response = await axios.get(`${API_BASE_URL}/candidates`, { params });
    return response.data;
  },

  // Delete a candidate record
  deleteCandidate: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/candidates/${id}`);
    return response.data;
  },

  // Analytics
  getAnalytics: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics`);
    return response.data;
  },

  // Skills & categories
  getSkills: async () => {
    const response = await axios.get(`${API_BASE_URL}/skills`);
    return response.data;
  },

  // Generate Email
  generateEmail: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/generate-email`, payload);
    return response.data;
  },
};
