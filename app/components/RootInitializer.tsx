"use client";
import { useEffect } from "react";

// Fallback UUID generator
function fallbackUUID() {
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ClientRootLayout({ 
  children, 
  serverInfo 
}: { 
  children: React.ReactNode;
  serverInfo?: any;
}) {
  useEffect(() => {
    let anon_id = document.cookie.split('; ').find(row => row.startsWith('anon_id='))?.split('=')[1];
    if (!anon_id) {
      anon_id = (window.crypto?.randomUUID ? window.crypto.randomUUID() : fallbackUUID());
      document.cookie = `anon_id=${anon_id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    }
    fetch('/api/track-anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon_id,
        useragent: navigator.userAgent,
        ip: '' // IP will be handled server-side if needed
      }),
      keepalive: true,
    });
  }, []);

  // Make serverInfo available globally
  useEffect(() => {
    if (serverInfo) {
      (window as any).__SERVER_INFO__ = serverInfo;
    }
  }, [serverInfo]);

  return <>{children}</>;
} 