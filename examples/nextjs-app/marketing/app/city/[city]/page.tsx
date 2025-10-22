export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  return (
    <div>
      <h1>[marketing] City Page {city}</h1>
    </div>
  );
}
