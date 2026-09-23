import { notFound } from "next/navigation";
import { getInterviewFull } from "@/lib/data";
import InterviewEditor from "./InterviewEditor";

export default async function InterviewEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInterviewFull(id);
  if (!data) return notFound();
  return <InterviewEditor data={data} />;
}
