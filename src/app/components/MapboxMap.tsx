"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDormData } from '@/server/actions';
import { UCDDormData } from '@/lib/types';
import CompositeScore from "./CompositeScore";

// Define the BuildingData interface to match what CompositeScore expects
interface BuildingData {
  name: string;
  fireIncidents: number;
  hasAlarm: boolean;
  hasSprinkler: boolean;
  energyIntensity: number;
  waterStrain: number;
  gasStrain: number;
  buildingAge: number;
  buildingType: string;
  demographics: string;
}

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapboxMapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export default function MapboxMap({
  style = "mapbox://styles/mapbox/standard", // Changed style for 3D buildings
  center = [-121.7520, 38.5382],
  zoom = 14, // Increased zoom level for better initial view
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [dormData, setDormData] = useState<UCDDormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDorm, setSelectedDorm] = useState<BuildingData | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Verify access token
      if (!mapboxgl.accessToken) {
        throw new Error("Mapbox access token is required");
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center,
        zoom,
        attributionControl: true,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl());

      // Handle map load: Set pitch and add 3D buildings
      map.current.on('load', () => {
        if (!map.current) return;
        map.current.setPitch(45); // Set initial pitch for 3D view

        // Ensure the composite source is loaded before adding the layer
        if (map.current.getSource('composite')) {
            // Check if the layer already exists before adding
            if (!map.current.getLayer('3d-buildings')) {
                map.current.addLayer({
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                      'fill-extrusion-color': '#aaa',
                      'fill-extrusion-height': [
                        "interpolate", ["linear"], ["get", "height"],
                        0, 0,
                        100, 100 // Max building height
                      ],
                      'fill-extrusion-base': [
                        "interpolate", ["linear"], ["get", "min_height"],
                        0, 0,
                        30, 30 // Min building height
                      ],
                      'fill-extrusion-opacity': 0.6
                    }
                });
            }
        } else {
            // If the source isn't ready yet, wait for it using 'sourcedata' event
            map.current.once('sourcedata', (e) => {
                 // Check if the event is for the composite source and it's loaded
                 // Also ensure map.current still exists and layer isn't added yet
                 if (e.isSourceLoaded && e.sourceId === 'composite' && map.current && !map.current.getLayer('3d-buildings')) {
                    map.current.addLayer({
                        'id': '3d-buildings',
                        'source': 'composite',
                        'source-layer': 'building',
                        'filter': ['==', 'extrude', 'true'],
                        'type': 'fill-extrusion',
                        'minzoom': 15,
                        'paint': {
                            'fill-extrusion-color': '#aaa',
                            'fill-extrusion-height': [
                                "interpolate", ["linear"], ["get", "height"],
                                0, 0, 100, 100
                            ],
                            'fill-extrusion-base': [
                                "interpolate", ["linear"], ["get", "min_height"],
                                0, 0, 30, 30
                            ],
                            'fill-extrusion-opacity': 0.6
                        }
                    });
                 }
            });
            console.warn("Composite source not immediately available on 'load'. Waiting for 'sourcedata'.");
        }
      });

      // Handle map load errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(e.error ? e.error.message : 'An error occurred while loading the map');
      });

      // Cleanup on unmount
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize map");
    }
  }, [style, center, zoom]);

  // Fetch dorm data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getDormData();
        setDormData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dorm data:", err);
        setError("Failed to load dorm locations.");
        setDormData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Add markers for dorms
  useEffect(() => {
    if (!map.current || !dormData || dormData.length === 0) return;

    dormData.forEach(dorm => {
      if (dorm.latitude !== undefined && dorm.longitude !== undefined) {
        // Create custom popup content with better styling
        const popupContent = `
          <div class="max-w-sm p-4 bg-white rounded-lg shadow-lg">
            <h3 class="text-lg font-bold mb-2 text-gray-800">${dorm.building_name}</h3>
            <p class="text-sm text-gray-600 mb-3"><strong>Address:</strong> ${dorm.address}</p>

            <div class="mb-3">
              <h4 class="font-semibold text-gray-700 mb-1">Fire Safety:</h4>
              <ul class="list-disc pl-4 text-sm text-gray-600">
                <li>Sprinklers: ${dorm.fire_safety.sprinkler.full ? 'Full' : dorm.fire_safety.sprinkler.partial ? 'Partial' : 'None'}</li>
                <li>Smoke Alarms: ${dorm.fire_safety.alarm.smoke ? 'Yes' : 'No'}</li>
                <li>Manual Pull Stations: ${dorm.fire_safety.alarm.manual_pull ? 'Yes' : 'No'}</li>
              </ul>
            </div>

            <div class="mb-3">
              <h4 class="font-semibold text-gray-700 mb-1">Monthly Utilities:</h4>
              <ul class="list-disc pl-4 text-sm text-gray-600">
                <li>Electricity: ${dorm.electricity ?? 'N/A'} kWh</li>
                <li>Steam: ${dorm.steam ?? 'N/A'} lbs</li>
                <li>Chilled Water: ${dorm.chilled_water ?? 'N/A'} Ton-Hrs</li>
                <li>Domestic Water: ${dorm.domestic_water ?? 'N/A'} Gallons</li>
              </ul>
            </div>

            <p class="text-sm text-gray-500 italic">Annual Fire Drills: ${dorm.num_fire_drills}</p>
          </div>
        `;

        // Create marker element
        const el = document.createElement("div");
        el.className = "mapbox-marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.background = "#4B9CD3"; // UC Davis blue
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        
        // Create the popup instance first
        const popup = new mapboxgl.Popup({
          offset: 25,
          maxWidth: "300px",
          className: "custom-popup"
        }).setHTML(popupContent);

        // Set the selected dorm when the popup opens
        popup.on('open', () => {
          const buildingData: BuildingData = {
            name: dorm.building_name,
            fireIncidents: dorm.num_fire_drills || 0,
            hasAlarm: dorm.fire_safety?.alarm?.smoke || false,
            hasSprinkler: dorm.fire_safety?.sprinkler?.full || dorm.fire_safety?.sprinkler?.partial || false,
            energyIntensity: dorm.electricity || 100,
            waterStrain: dorm.domestic_water || 50,
            gasStrain: dorm.steam || 30,
            buildingAge: 40, // Default age
            buildingType: "residential",
            demographics: "15% elderly, 25% low-income, 10% disabled"
          };
          setSelectedDorm(buildingData);
        });
        
        // Add the marker to the map and attach the popup
        new mapboxgl.Marker(el)
          .setLngLat([dorm.longitude, dorm.latitude])
          .setPopup(popup) // Attach the configured popup
          .addTo(map.current!); 
      }
    });
  }, [dormData]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Map Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2">Troubleshooting steps:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
              <li>Check your internet connection</li>
              <li>Verify that you have a valid Mapbox access token</li>
              <li>Ensure your Mapbox account is active</li>
              <li>Try refreshing the page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 w-full h-full">
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
        />
        <style jsx global>{`
          .mapboxgl-popup-content {
            padding: 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .mapboxgl-popup-close-button {
            padding: 4px 8px;
            color: #4B5563;
            font-size: 16px;
            right: 4px;
            top: 4px;
          }
          .mapboxgl-popup-close-button:hover {
            background-color: #F3F4F6;
            border-radius: 4px;
          }
        `}</style>
      </div>
      
      {/* Fire Resilience Score Modal */}
      {selectedDorm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={() => setSelectedDorm(null)}
        >
          <div onClick={e => e.stopPropagation()} className="max-w-2xl w-full">
            <CompositeScore building={selectedDorm} />
            <div className="text-center mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium"
                onClick={() => setSelectedDorm(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
