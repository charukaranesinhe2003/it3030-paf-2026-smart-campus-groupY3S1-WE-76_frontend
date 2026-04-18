import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082";

/**
 * Shared Axios instance for all authenticated API calls.
 *
 * The request interceptor automatically attaches the JWT from localStorage
 * as a Bearer token on every outgoing request.
 *
 * Teammates should import this instead of creating their own axios instances
 * when calling protected endpoints:
 *
 *   import axiosInstance from "@/services/axiosInstance";
 *   axiosInstance.get("/api/bookings");
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach JWT ─────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // localStorage is only available in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ───────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
