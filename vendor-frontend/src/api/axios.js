import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const connectionListeners = new Set();

export const subscribeToConnectionStatus = (listener) => {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
};

const notifyConnectionStatus = (isFailed) => {
  connectionListeners.forEach((listener) => listener(isFailed));
};

api.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    notifyConnectionStatus(false);
    return response;
  },
  (error) => {
    if (!error.response) {
      notifyConnectionStatus(true);
    }
    return Promise.reject(error);
  }
);

export default api;