// app/watch/page.tsx
import React, { Suspense } from "react";
import WatchClient from "./WatchClient"; // Your existing client component

export default function WatchPage() {
  return (
    <Suspense fallback={<div>You Need to enable JavaScript.</div>}>
      <WatchClient />
    </Suspense>
  );
}
