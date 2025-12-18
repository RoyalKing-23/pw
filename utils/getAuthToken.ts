// utils/getAuthToken.ts
import Cookies from 'js-cookie';

export const getAuthToken = (): string | null => {
  // First, try to get token from cookies
  const cookieToken = Cookies.get('accessToken');
  if (cookieToken) return cookieToken;

  // Then fallback to localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }

  return null;
};
