"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDormData } from "@/server/actions";
import { UCDDormData } from "@/lib/types";

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapboxMapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export default function MapboxMap({
  style = "mapbox://styles/mapbox/standard", // Changed style for 3D buildings
  center = [-121.752, 38.5382],
  zoom = 14, // Increased zoom level for better initial view
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]); // Keep ref for markers
  const [dormData, setDormData] = useState<UCDDormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        pitch: 45, // Set initial pitch here
        attributionControl: true,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl());

      // Handle map load: Add 3D buildings (pitch is already set)
      map.current.on("load", () => {
        if (!map.current) return;

        // Ensure the composite source is loaded before adding the layer
        if (map.current.getSource("composite")) {
          // Check if the layer already exists before adding
          if (!map.current.getLayer("3d-buildings")) {
            map.current.addLayer({
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["get", "height"],
                  0,
                  0,
                  100,
                  100, // Max building height
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["get", "min_height"],
                  0,
                  0,
                  30,
                  30, // Min building height
                ],
                "fill-extrusion-opacity": 0.6,
              },
            });
          }
        } else {
          // If the source isn't ready yet, wait for it using 'sourcedata' event
          map.current.once("sourcedata", (e) => {
            // Check if the event is for the composite source and it's loaded
            // Also ensure map.current still exists and layer isn't added yet
            if (
              e.isSourceLoaded &&
              e.sourceId === "composite" &&
              map.current &&
              !map.current.getLayer("3d-buildings")
            ) {
              map.current.addLayer({
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 15,
                paint: {
                  "fill-extrusion-color": "#aaa",
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["get", "height"],
                    0,
                    0,
                    100,
                    100,
                  ],
                  "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["get", "min_height"],
                    0,
                    0,
                    30,
                    30,
                  ],
                  "fill-extrusion-opacity": 0.6,
                },
              });
            }
          });
          console.warn(
            "Composite source not immediately available on 'load'. Waiting for 'sourcedata'."
          );
        }
      });

      // Handle map load errors
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setError(
          e.error ? e.error.message : "An error occurred while loading the map"
        );
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
    const mapInstance = map.current;
    if (!mapInstance || !dormData) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const initialZoom = mapInstance.getZoom(); // Get initial zoom for later

    dormData.forEach((dorm) => {
      if (dorm.latitude && dorm.longitude) {
        const dormLngLat: [number, number] = [dorm.longitude, dorm.latitude];

        // --- Determine Marker Color ---
        // Provide default score 0 if undefined
        const scoreNum = dorm.fire_risk_score ?? 0;
        const markerColor = getColorForScore(scoreNum); // Use helper function

        // Create a custom marker element
        const el = document.createElement("div");
        el.className = "custom-dorm-marker";
        // Apply color based on score
        el.style.backgroundColor = markerColor;
        el.style.width = '20px'; // Ensure size is defined
        el.style.height = '20px'; // Ensure size is defined
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white'; // Add border for visibility
        el.style.cursor = 'pointer'; // Add cursor pointer for better UX

        // --- Add click listener to marker element for flyTo animation ---
        el.addEventListener("click", () => {
          mapInstance?.flyTo({
            center: dormLngLat,
            zoom: 16.5, // Adjust desired zoom level on click
            pitch: 50, // Optional: Adjust pitch slightly more
            speed: 0.8, // Adjust speed
            curve: 1.4, // Adjust curve factor
            essential: true, // Ensures animation completes
          });
        });
        // --- End of added click listener ---

        // --- Create Popup Content ---
        // Directly include score and action steps
        // Use optional chaining and nullish coalescing for safety
        const scoreDisplay = dorm.fire_risk_score !== undefined ? `<strong>Fire Risk Score:</strong> ${dorm.fire_risk_score}/100` : 'Score not available.';
        // Format action steps - split by newline and create list items
        const stepsHtml = dorm.action_steps
          ? `<strong>Action Steps:</strong><ul>${dorm.action_steps.split('\n').map(step => `<li>${step.trim()}</li>`).join('')}</ul>`
          : 'Action steps not available.';

        const popupContent = `
          <div class="p-2">
            <h3 class="text-lg font-semibold mb-1">${dorm.building_name}</h3>
            <p class="text-sm text-gray-600 mb-2">${dorm.address}</p>
            <div class="text-sm mb-2">
              ${scoreDisplay}
            </div>
            <div class="text-sm">
              ${stepsHtml}
            </div>
            <!-- Removed button and score container -->
          </div>
        `;

        // Create the popup instance
        const popup = new mapboxgl.Popup({
          offset: 25,
          maxWidth: "320px",
          className: "custom-dorm-popup",
        }).setHTML(popupContent);

        // Create the marker with the colored element
        const marker = new mapboxgl.Marker(el)
          .setLngLat(dormLngLat)
          .setPopup(popup);

        // Add listener for when the popup opens - ONLY for zoom/close logic now
        popup.on("open", () => {
          // Keep the close listener for zoom adjustment.
          setTimeout(() => {
            // Add listener for when THIS popup closes (zoom out)
            popup.once("close", () => {
              mapInstance?.easeTo({
                zoom: initialZoom + 1, // Zoom out slightly
                pitch: 45, // Reset pitch
                duration: 500,
              });
            });
          }, 0);
        });

        // Add the marker to the map
        marker.addTo(mapInstance);
        markersRef.current.push(marker);
      }
    });

    // Cleanup markers
    return () => {
      // console.log("Cleaning up markers..."); // Keep if useful
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  // Ensure dependencies are correct - add getColorForScore if it's defined outside and used
  }, [dormData, map, zoom]); // Assuming getColorForScore is stable or defined inside/outside scope appropriately

  // Helper function to determine marker color based on score
  const getColorForScore = (score: number): string => {
    if (score >= 90) return "#FF0000"; // Red
    if (score >= 80) return "#FF4500"; // OrangeRed
    if (score >= 70) return "#FFA500"; // Orange
    if (score >= 60) return "#FFD700"; // Gold
    return "#90EE90"; // LightGreen (for scores below 60)
  };

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
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
        <style jsx global>{`
          .mapboxgl-popup-content {
            padding: 0; /* Remove default padding */
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .custom-dorm-popup .mapboxgl-popup-content-custom {
            /* Add specific styles for the custom content div if needed */
            font-family: sans-serif;
          }
          .mapboxgl-popup-close-button {
            padding: 4px 8px;
            color: #4b5563;
            font-size: 16px;
            right: 4px;
            top: 4px;
          }
          .mapboxgl-popup-close-button:hover {
            background-color: #f3f4f6;
            border-radius: 4px;
          }
        `}</style>
      </div>
    </>
  );
}
