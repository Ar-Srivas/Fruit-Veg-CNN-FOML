const API_BASE_URL = typeof window !== "undefined"
  ? process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://api.foml.arijitsrivastava.tech"
  : "http://localhost:8000";

export { API_BASE_URL };