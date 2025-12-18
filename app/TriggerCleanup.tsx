// components/TriggerCleanup.tsx
"use client";

import { useEffect } from "react";

export default function TriggerCleanup() {
  useEffect(() => {
    fetch("/api/cleanupVerifications", { method: "POST" }).catch(console.error);
  }, []);

  return null; // This component doesn't render anything
}