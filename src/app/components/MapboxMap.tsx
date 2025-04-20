"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDormData } from "@/server/actions";
import { UCDDormData } from "@/lib/types";
import CompositeScore from "./CompositeScore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

// Extend HTMLButtonElement type for tracking listener
interface HTMLButtonElementWithTracking extends HTMLButtonElement {
  _clickHandlerAttached?: boolean;
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
  center = [-121.752, 38.5382],
  zoom = 14, // Increased zoom level for better initial view
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]); // Keep ref for markers
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
      map.current.on("load", () => {
        if (!map.current) return;
        map.current.setPitch(45); // Set initial pitch for 3D view

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
    if (!map.current || !dormData || dormData.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    dormData.forEach((dorm) => {
      // Generate a unique ID for the button based on dorm name or ID
      const buttonId = `show-score-${dorm.building_name
        .replace(/\s+/g, "-")
        .toLowerCase()}`;

      if (dorm.latitude !== undefined && dorm.longitude !== undefined) {
        // Create expanded popup content directly here
        const popupContent = `
          <div class="max-w-sm p-4 bg-white rounded-lg shadow-lg mapboxgl-popup-content-custom">
            <h3 class="text-lg font-bold mb-2 text-gray-800">${
              dorm.building_name
            }</h3>
            <p class="text-sm text-gray-600 mb-3"><strong>Address:</strong> ${
              dorm.address || "N/A"
            }</p>

            <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                <div>
                    <span class="font-semibold text-gray-700">Fire Drills:</span>
                    <span class="text-gray-600"> ${
                      dorm.num_fire_drills ?? "N/A"
                    }</span>
                </div>
            </div>

            <div class="mb-3">
              <h4 class="font-semibold text-gray-700 mb-1">Fire Safety:</h4>
              <ul class="list-disc pl-4 text-sm text-gray-600">
                <li>Sprinklers: ${
                  dorm.fire_safety.sprinkler.full
                    ? "Full"
                    : dorm.fire_safety.sprinkler.partial
                    ? "Partial"
                    : "None"
                }</li>
                <li>Smoke Alarms: ${
                  dorm.fire_safety.alarm.smoke ? "Yes" : "No"
                }</li>
                <li>Manual Pull Stations: ${
                  dorm.fire_safety.alarm.manual_pull ? "Yes" : "No"
                }</li>
              </ul>
            </div>

            <div class="mb-3">
              <h4 class="font-semibold text-gray-700 mb-1">Avg. Monthly Utilities:</h4>
              <ul class="list-disc pl-4 text-sm text-gray-600">
                <li>Electricity: ${dorm.electricity ?? "N/A"} kWh</li>
                <li>Steam: ${dorm.steam ?? "N/A"} lbs</li>
                <li>Chilled Water: ${dorm.chilled_water ?? "N/A"} Ton-Hrs</li>
                <li>Domestic Water: ${dorm.domestic_water ?? "N/A"} Gallons</li>
              </ul>
            </div>
            
            <div class="mt-4 pt-3 border-t border-gray-200 text-center">
                <button id="${buttonId}" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300">View Resilience Score</button>
            </div>
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

        // Create the popup instance
        const popup = new mapboxgl.Popup({
          offset: 25,
          maxWidth: "320px", // Adjust max width as needed
          className: "custom-dorm-popup", // Add specific class for styling
        }).setHTML(popupContent);

        // Add listener for when popup opens to attach button click handler
        popup.on("open", () => {
          const button = document.getElementById(
            buttonId
          ) as HTMLButtonElementWithTracking | null;
          if (button) {
            // Prevent duplicate listeners if popup reopens
            const clickHandler = () => {
              // Construct BuildingData object when button is clicked
              const buildingData: BuildingData = {
                name: dorm.building_name,
                // Use defaults or N/A for fields not directly available on dorm object
                fireIncidents: dorm.num_fire_drills || 0,
                hasAlarm: dorm.fire_safety?.alarm?.smoke || false,
                hasSprinkler:
                  dorm.fire_safety?.sprinkler?.full ||
                  dorm.fire_safety?.sprinkler?.partial ||
                  false,
                energyIntensity: dorm.electricity || 100, // Example default
                waterStrain: dorm.domestic_water || 50, // Example default
                gasStrain: dorm.steam || 30, // Example default
                buildingAge: 40, // Example default/placeholder
                buildingType: "residential", // Example default/placeholder
                demographics: "N/A", // Example default/placeholder
              };
              setSelectedDorm(buildingData);
              // Remove listener after click to prevent memory leaks if needed, though reopening popup adds new listener
              // button.removeEventListener('click', clickHandler);
            };
            // Check if listener already exists before adding (simple way)
            if (!button._clickHandlerAttached) {
              button.addEventListener("click", clickHandler);
              button._clickHandlerAttached = true;
            }
          }
        });

        // Add the marker to the map and attach the popup
        const marker = new mapboxgl.Marker(el)
          .setLngLat([dorm.longitude, dorm.latitude])
          .setPopup(popup) // Attach the configured popup
          .addTo(map.current!);

        markersRef.current.push(marker); // Keep track of markers
      }
    });

    // Cleanup markers
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
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

      {/* Shadcn UI Dialog for Composite Score */}
      <Dialog
        open={!!selectedDorm}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setSelectedDorm(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          {selectedDorm && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedDorm.name} - Resilience Score
                </DialogTitle>
                {/* Optional: Add DialogDescription if needed */}
                {/* <DialogDescription>Details about the building's resilience score.</DialogDescription> */}
              </DialogHeader>
              <div className="py-4">
                <CompositeScore building={selectedDorm} />
              </div>
              <DialogFooter>
                {/* DialogClose automatically handles closing the dialog */}
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
