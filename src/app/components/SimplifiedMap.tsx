"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { DormData } from "@/lib/types";
import BuildingDataModal from "./BuildingDataModal";
import { getDormData } from "@/server/actions";
import { getScoreColor } from "@/lib/utils";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
mapboxgl.accessToken = mapboxToken;

const DEFAULT_MAP_CENTER = [-121.762, 38.5382] satisfies [number, number];

const DEFAULT_MAP_VIEW = {
  center: DEFAULT_MAP_CENTER,
  zoom: 14,
  pitch: 0, // Default flat view
  bearing: 0, // Default north orientation
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
        center: DEFAULT_MAP_CENTER,
        zoom: 14.5,
      });

      map.current = newMap;

      newMap.on("load", () => {
        console.log("Map loaded successfully");
        setLoading(false);

        // Store initial map view for restoration when modal closes
        originalMapView.current = {
          center: DEFAULT_MAP_CENTER,
          zoom: newMap.getZoom(),
          pitch: newMap.getPitch(),
          bearing: newMap.getBearing(),
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

        // Save current view before zooming
        if (currentMap) {
          originalMapView.current = {
            center: currentMap.getCenter().toArray() as [number, number],
            zoom: currentMap.getZoom(),
            pitch: currentMap.getPitch(),
            bearing: currentMap.getBearing(),
          };

          // Zoom to marker location with smooth animation
          if (dorm.longitude !== undefined && dorm.latitude !== undefined) {
            currentMap.flyTo({
              center: [dorm.longitude - 0.001, dorm.latitude],
              zoom: 17, // Closer zoom level
              pitch: 45, // Tilt the view to show 3D buildings
              bearing: -20, // Slight rotation for better perspective
              speed: 1.5, // Animation speed
              curve: 1.5, // Animation curve
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

      <BuildingDataModal
        building={selectedDorm}
        isOpen={isModalOpen}
        onClose={() => {
          // Close the modal
          setIsModalOpen(false);

          // Zoom back out to original view
          if (map.current) {
            map.current.flyTo({
              ...DEFAULT_MAP_VIEW,
              speed: 1.5,
              curve: 1.5,
              essential: true,
            });
          }
        }}
      />
    </div>
  );
}
