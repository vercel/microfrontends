export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div>
      <h1>[campaign] on marketing {JSON.stringify(slug)}</h1>
    </div>
  );
}
