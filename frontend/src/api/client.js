import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const expired =
      err.response?.status === 401 &&
      localStorage.getItem("token") &&
      !err.config?.url?.includes("/auth/login");
    if (expired) {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;