import IBSection from "@/components/ib/IBSection";
export default async function IBPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return <IBSection key={(path || []).join("/")} path={path} />;
}
