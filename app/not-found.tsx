'use client';
export const dynamic = 'force-dynamic'; // <-- Add this line first


import { useEffect } from 'react';
import "./globals.css";
export default function NotFound() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.warn('404 - Page not found:', window.location.pathname);

      fetch('/api/log', {  // <--- updated logging URL here
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.error('Logging 404 failed:', err));
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl mt-4">This page could not be found.</p>
      <a href="/study" className="mt-6 text-blue-400 hover:underline">
        Go back home
      </a>
    </div>
  );
}
