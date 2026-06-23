import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Token successfully attached to request!"); 
    } else {
      console.error("❌ No token found in localStorage! You are not logged in properly.");
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;