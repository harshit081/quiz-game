import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export default api;
