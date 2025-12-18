// page.tsx (server component)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubjectClientPage from "./SubjectClientPage";

export default async function Page({ params }: { params: Promise<{ batchid: string, subjectid: string }> }) {
  const { batchid } = await params;
  const anon_id = (await cookies()).get("anon_id")?.value;

  if (!anon_id) {
    redirect(`/key-generate?batchId=${batchid}`);
  }

  // If verified, render the client page
  return <SubjectClientPage />;
}
