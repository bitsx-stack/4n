import axios from 'axios';
import { handleApiError } from './handleApiError';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
});

// Request interceptor (add auth token)
api.interceptors.request.use(
  (config:any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error:any) => Promise.reject(error)
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = handleApiError(error); // extract user-friendly message
    error.friendlyMessage = message; // attach it to error object

    return Promise.reject(error);
  }
);


export default api;