import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default axios;
