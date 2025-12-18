'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function NetworkStatusToast() {
  useEffect(() => {
    const handleStatusChange = () => {
      if (navigator.onLine) {
        toast.success('✅ You are back online');
      } else {
        toast.error('⚠️ You are offline');
      }
    };

    // Show status on load
    handleStatusChange();

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return null; 
}
