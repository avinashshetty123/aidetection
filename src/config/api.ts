// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001' 
    : 'https://aidetection-production.up.railway.app');

console.log('API Base URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },
  DETECT: `${API_BASE_URL}/api/detect`,
  TOGGLE_RECORDING: `${API_BASE_URL}/api/toggle-recording`,
  SUSPICIOUS: `${API_BASE_URL}/api/suspicious`,
  DETECT_TEST_RESPONSE: `${API_BASE_URL}/api/detect-test-response`,
  V1_ANALYZE: `${API_BASE_URL}/api/v1/analyze`,
};

export default API_BASE_URL; 