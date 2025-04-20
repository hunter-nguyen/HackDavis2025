"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from '@turf/turf';
import { DormData } from "@/lib/types";
import BuildingDataModal from "./BuildingDataModal";
import { getDormData } from "@/server/actions";
import { getScoreColor } from "@/lib/utils";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
mapboxgl.accessToken = mapboxToken;

const DEFAULT_MAP_VIEW = {
  longitude: -121.7516,
  latitude: 38.5382,
  zoom: 15
};

export default function SimplifiedMap() {
  // DOM references
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dorms, setDorms] = useState<DormData[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<DormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationHour, setSimulationHour] = useState(0);
  const [fireSpreadData, setFireSpreadData] = useState<any>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [isLoadingFireSpread, setIsLoadingFireSpread] = useState(false);

  // Store original map view to restore when closing modal
  const originalMapView = useRef(DEFAULT_MAP_VIEW);

  // Fetch dorm data
  useEffect(() => {
    async function fetchDormData() {
      try {
        const data = await getDormData();
        console.log("Fetched dorm data:", data.length, "dorms");
        setDorms(data);
      } catch (err) {
        console.error("Error fetching dorm data:", err);
        setError("Failed to load dorm data");
      }
    }

    fetchDormData();
  }, []);

  // Initialize map only once
  useEffect(() => {
    console.log("Map container exists:", !!mapContainer.current);
    console.log("Mapbox token:", !!mapboxToken);

    // Only initialize once and if container exists
    if (map.current || !mapContainer.current) return;

    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard",
        center: [-121.764, 38.54],
        zoom: 14.5,
      });

      map.current = newMap;

      newMap.on("load", () => {
        console.log("Map loaded successfully");
        setLoading(false);

        // Store initial map view for restoration when modal closes
        originalMapView.current = {
          longitude: -121.7516,
          latitude: 38.5382,
          zoom: newMap.getZoom(),
        };
      });

      newMap.on("error", (e) => {
        console.error("Map error:", e);
        setError("Failed to initialize map");
      });
    } catch (err) {
      console.error("Error creating map:", err);
      setError("Failed to create map");
    }

    // Cleanup
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when dorm data is available and map is loaded
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap || loading || dorms.length === 0) return;

    console.log("Adding", dorms.length, "markers to map");

    // Clear existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }

    // Add markers for each dorm
    dorms.forEach((dorm) => {
      if (!dorm.latitude || !dorm.longitude) {
        console.log(`Dorm ${dorm.building_name} missing coordinates`);
        return;
      }

      // Get color based on risk score - matching BuildingDataModal calculation
      const safetyScore = dorm.fire_risk_score ?? 50;

      // Use the same color logic as BuildingDataModal
      const markerColor = getScoreColor(safetyScore);

      // Create color-coded Mapbox marker
      const marker = new mapboxgl.Marker({
        color: markerColor,
      })
        .setLngLat([dorm.longitude, dorm.latitude])
        .addTo(currentMap);

      // Add click handler with zoom animation
      marker.getElement().addEventListener("click", () => {
        console.log("Marker clicked:", dorm.building_name);

        // Reset all simulation-related states
        setIsSimulating(false);
        setSimulationHour(0);
        setFireSpreadData(null);
        setSimulationComplete(false);
        setIsLoadingFireSpread(false);

        // Clean up existing fire visualization layers
        if (map.current) {
          if (map.current.getLayer('fire-layer-fill')) {
            map.current.removeLayer('fire-layer-fill');
          }
          if (map.current.getLayer('fire-layer-line')) {
            map.current.removeLayer('fire-layer-line');
          }
          if (map.current.getSource('fire-source')) {
            map.current.removeSource('fire-source');
          }
        }

        // Save current view before zooming
        if (currentMap) {
          originalMapView.current = {
            longitude: currentMap.getCenter().lng,
            latitude: currentMap.getCenter().lat,
            zoom: currentMap.getZoom(),
          };

          // Zoom to marker location with smooth animation
          if (dorm.longitude !== undefined && dorm.latitude !== undefined) {
            currentMap.flyTo({
              center: [dorm.longitude - 0.001, dorm.latitude],
              zoom: 17, // Closer zoom level
              pitch: 45, // Tilt the view to show 3D buildings
              bearing: -20, // Slight rotation for better perspective
              speed: 1, // Animation speed
              curve: 1, // Animation curve
              essential: true, // This animation is essential for usability
            });
          }
        }

        // Show modal with building details
        setSelectedDorm(dorm);
        setIsModalOpen(true);
      });

      // Store marker reference
      markersRef.current.push(marker);
    });

    console.log("Added", markersRef.current.length, "markers");
  }, [dorms, loading]);

  // Fire simulation logic
  useEffect(() => {
    if (!isSimulating || !map.current || !selectedDorm) {
      setSimulationHour(0);
      setFireSpreadData(null);
      setSimulationComplete(false);
      setIsLoadingFireSpread(false);
      // Clean up existing layers
      if (map.current) {
        if (map.current.getLayer('fire-layer-fill')) {
          map.current.removeLayer('fire-layer-fill');
        }
        if (map.current.getLayer('fire-layer-line')) {
          map.current.removeLayer('fire-layer-line');
        }
        if (map.current.getSource('fire-source')) {
          map.current.removeSource('fire-source');
        }
      }
      return;
    }

    const startSimulation = async () => {
      try {
        setIsLoadingFireSpread(true);
        const response = await fetch('/api/fireSpread', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ building: selectedDorm }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch fire spread data');
        }

        const data = await response.json();
        console.log('Fire spread data:', data);
        setFireSpreadData(data);
        setIsLoadingFireSpread(false);
      } catch (error) {
        console.error('Error fetching fire spread:', error);
        setIsSimulating(false);
        setIsLoadingFireSpread(false);
      }
    };

    if (!fireSpreadData) {
      startSimulation();
      return;
    }

    // Set simulation complete when reaching hour 3
    if (simulationHour >= 3 && !simulationComplete) {
      setSimulationComplete(true);
      return;
    }

    // Update fire visualization based on current hour
    const currentHourData = fireSpreadData.hours[simulationHour];
    if (!currentHourData) return;

    console.log('Current hour data:', currentHourData);

    // Transform coordinates to be centered around the building location
    const transformedCoordinates = currentHourData.coordinates.map(coord => [
      selectedDorm.longitude + coord[0],
      selectedDorm.latitude + coord[1]
    ]);
    
    // Create a feature for the fire spread
    const fireSource = {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [transformedCoordinates]
        }
      }
    };

    // Add or update the fire source and layers
    const updateFireVisualization = () => {
      if (!map.current) return;

      // Add or update the fire source
      if (!map.current.getSource('fire-source')) {
        map.current.addSource('fire-source', fireSource);
      } else {
        (map.current.getSource('fire-source') as mapboxgl.GeoJSONSource).setData(fireSource.data);
      }

      // Add fire layers if they don't exist
      if (!map.current.getLayer('fire-layer-fill')) {
        map.current.addLayer({
          id: 'fire-layer-fill',
          type: 'fill',
          source: 'fire-source',
          paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.3
          }
        });

        map.current.addLayer({
          id: 'fire-layer-line',
          type: 'line',
          source: 'fire-source',
          paint: {
            'line-color': '#ff0000',
            'line-width': 2,
            'line-blur': 1,
            'line-opacity': 0.8
          }
        });
      }
    };

    updateFireVisualization();

    // Auto-advance timer only if not complete
    if (!simulationComplete) {
      const hourTimer = setTimeout(() => {
        if (simulationHour < 3) {
          setSimulationHour(prev => prev + 1);
        }
      }, 5000);

      return () => {
        clearTimeout(hourTimer);
      };
    }
  }, [isSimulating, simulationHour, selectedDorm, fireSpreadData, simulationComplete]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 2s linear infinite",
                margin: "0 auto 20px auto",
              }}
            ></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.9)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              color: "#e53e3e",
            }}
          >
            <p>Error: {error}</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          backgroundColor: "#f0f0f0",
        }}
      />

      {/* Hour Display Overlay */}
      {(isSimulating || isLoadingFireSpread) && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg z-10">
          <div className="px-4 py-2 text-white font-medium text-sm">
            {isLoadingFireSpread ? (
              <div className="flex items-center space-x-2 py-1">
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                <span>Visualizing...</span>
              </div>
            ) : (
              [1, 2, 3].map((hour) => (
                <div
                  key={hour}
                  onClick={() => simulationComplete && setSimulationHour(hour - 1)}
                  className={`flex items-center space-x-2 py-1 ${
                    simulationHour + 1 === hour ? 'text-red-400' : 'text-white/70'
                  } ${
                    simulationComplete ? 'cursor-pointer hover:bg-white/10' : ''
                  }`}
                >
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      simulationHour + 1 === hour ? 'bg-red-400' : 
                      simulationHour + 1 > hour ? 'bg-red-400/50' : 'bg-white/30'
                    }`}
                  />
                  <span>Hour {hour}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <BuildingDataModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDorm(null);
          if (map.current) {
            map.current.easeTo({
              center: [originalMapView.current.longitude, originalMapView.current.latitude],
              zoom: originalMapView.current.zoom,
              duration: 1000,
            });
          }
        }}
        building={selectedDorm!}
        onStartSimulation={async () => {
          setSimulationComplete(false); // Reset completion state
          setSimulationHour(0); // Reset hour
          setIsSimulating(true); // Start simulation
        }}
        isSimulating={isSimulating}
        simulationHour={simulationHour}
        simulationComplete={simulationComplete}
        isLoadingFireSpread={isLoadingFireSpread}
      />
    </div>
  );
}