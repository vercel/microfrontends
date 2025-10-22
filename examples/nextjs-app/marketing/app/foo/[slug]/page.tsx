export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div>
      <h1>[marketing] Foo Page {slug}</h1>
    </div>
  );
}
