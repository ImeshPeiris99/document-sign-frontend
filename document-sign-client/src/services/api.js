// src/services/api.js
// This file handles all backend API calls using axios

import axios from "axios";

// Base API URL (backend)
const api = axios.create({
  baseURL: "https://localhost:7157/api", // backend base URL
});

export default api;
