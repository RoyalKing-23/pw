'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Global error caught:', error);

    // Optional: send to your backend or logging service
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-900 text-white">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="mt-2">{error.message}</p>
      <button
        className="mt-6 px-4 py-2 bg-white text-red-900 rounded"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
