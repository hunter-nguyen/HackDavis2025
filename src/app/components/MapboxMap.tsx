"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDormData } from "@/server/actions";
import { DormData, UCDDormData } from "@/lib/types";
import BuildingDataModal from "./BuildingDataModal";

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapboxMapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export default function MapboxMap({
  style = "mapbox://styles/mapbox/standard",
  center = [-121.752, 38.5382],
  zoom = 14,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]); // Keep ref for markers
  const [dormData, setDormData] = useState<UCDDormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [selectedBuilding, setSelectedBuilding] = useState<DormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  }, [style, center, zoom]); // Restore the proper dependency array

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

  // Adjust map padding when modal is opened/closed
  useEffect(() => {
    if (!map.current) return;
    
    // Add padding to the left side when modal is open
    if (isModalOpen) {
      map.current.setPadding({ left: 400, top: 0, right: 0, bottom: 0 });
    } else {
      map.current.setPadding({ left: 0, top: 0, right: 0, bottom: 0 });
    }
  }, [isModalOpen]);

  // Add markers for dorms
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !dormData) return;

    // Clear any existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each dorm
    dormData.forEach((dorm) => {
      if (dorm.latitude && dorm.longitude) {
        const dormLngLat: [number, number] = [dorm.longitude, dorm.latitude];

        // --- Determine Marker Color ---
        const scoreNum = dorm.fire_risk_score ?? 0;
        const markerColor = getColorForScore(scoreNum);

        // --- Create standard marker with color option ---
        const marker = new mapboxgl.Marker({
          color: markerColor, // Set color directly
        }).setLngLat(dormLngLat);

        // --- Add click listener to the marker's default element ---
        const markerElement = marker.getElement();
        markerElement.style.cursor = "pointer"; // Add cursor pointer
        
        // Simple click handler that only opens the modal without changing the map
        markerElement.addEventListener("click", () => {
          // Simply open the modal with the selected building data
          // No map movement or camera changes at all
          setSelectedBuilding(dorm);
          setIsModalOpen(true);
        });

        marker.addTo(mapInstance);
        markersRef.current.push(marker);
      }
    });
  }, [dormData]); // Only re-run if dormData changes

  // Helper function to determine marker color based on score
  const getColorForScore = (score: number): string => {
    if (score >= 90) return "#FF0000"; // Red
    if (score >= 70) return "#EEA500"; // Orange
    return "#006400"; // LightGreen
  };

  // Handler for closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      <div className={`fixed inset-0 w-full h-full transition-all duration-300 ${isModalOpen ? 'pl-[400px]' : 'pl-0'}`}>
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
      </div>
      
      {/* Building Data Modal */}
      <BuildingDataModal 
        building={selectedBuilding}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
