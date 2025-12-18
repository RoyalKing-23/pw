import { Suspense } from "react";
import BatchesClient from "./BatchesClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchesClient />
    </Suspense>
  );
}
