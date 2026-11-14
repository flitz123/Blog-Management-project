import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
  configuredApiUrl || ""
);

const api = axios.create({
  baseURL: import.meta.env.PROD && isLocalApiUrl
    ? "/api"
    : configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api"),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
