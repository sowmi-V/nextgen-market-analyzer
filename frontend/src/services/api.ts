import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  const isAuthRequest =
    config.url?.includes("/auth/register/") ||
    config.url?.includes("/auth/token/");

  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;