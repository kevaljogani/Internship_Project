
import axios from "axios";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000/api"
  : "/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default axiosInstance;
