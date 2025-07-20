// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000',
  API_KEY: process.env.NEXT_PUBLIC_BACKEND_API_KEY || '',
} as const;

export const API_ENDPOINTS = {
  QUERY: '/query',
  SAMPLE: '/sample',
} as const; 