import MapboxMap from "./components/MapboxMap";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Mapbox Map Demo</h1>
      <div className="w-full max-w-4xl mx-auto">
        <MapboxMap />
      </div>
    </main>
  );
}
