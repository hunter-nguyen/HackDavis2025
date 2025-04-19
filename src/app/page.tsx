import MapboxMap from "./components/MapboxMap";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="w-full max-w-4xl mx-auto">
        <MapboxMap />
      </div>
    </main>
  );
}
