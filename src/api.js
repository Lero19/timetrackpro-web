import axios from "axios";

// Replace with the exact HTTPS URL your backend printed in Phase 5
const API_BASE = "https://localhost:7252/api";

export const api = axios.create({ baseURL: API_BASE });