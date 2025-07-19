// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://86769ebd983a.ngrok-free.app',
  API_KEY: process.env.NEXT_PUBLIC_BACKEND_API_KEY || '',
} as const;

export const API_ENDPOINTS = {
  QUERY: '/query',
} as const; 