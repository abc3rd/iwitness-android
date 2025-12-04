// src/config.ts

// For Vite, backend URLs go in VITE_ variables.
// Example .env value later:
// VITE_API_BASE_URL="https://your-backend-url.com"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== ''
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : '';
