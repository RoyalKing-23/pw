import { Suspense } from "react";
import BatchDetailPage from "./BatchDetail";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-4 text-red-600">Loading...</div>}>
      <BatchDetailPage />
    </Suspense>
  );
}
