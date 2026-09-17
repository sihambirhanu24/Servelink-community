/**
 * Centralized API configuration
 * 
 * In production (Vercel), NEXT_PUBLIC_API_URL should be:
 * https://servelink-backend-ef06.onrender.com/api
 * 
 * In development, it defaults to:
 * http://localhost:5000/api
 */

// API base URL with /api path
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API base URL without /api path (for uploads, sockets, etc.)
export const API_BASE_URL = API_URL.replace('/api', '');

// Helper to construct full API URLs
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path already starts with 'api/', use API_BASE_URL
  if (cleanPath.startsWith('api/')) {
    return `${API_BASE_URL}/${cleanPath}`;
  }
  
  // Otherwise use API_URL
  return `${API_URL}/${cleanPath}`;
}

// Helper to get upload/media URLs
export function getMediaUrl(path: string): string {
  if (!path) return '';
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

export default {
  API_URL,
  API_BASE_URL,
  getApiUrl,
  getMediaUrl,
};
