import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Ensure this points to your Node server
});

// Intercept all requests to attach the token
api.interceptors.request.use(
  (config) => {
    // Check local storage for your token
    // Note: If your login system saves it under a different name like 'userToken', change it here!
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