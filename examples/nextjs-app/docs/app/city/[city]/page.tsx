export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  return (
    <div>
      <h1>[docs] City Page {city}</h1>
    </div>
  );
}
