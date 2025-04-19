"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CompositeScore from "./CompositeScore";

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapboxMapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

interface Building {
  id: string;
  name: string;
  coordinates: [number, number];
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

const demoBuildings: Building[] = [
  {
    id: "olson",
    name: "Olson Hall",
    coordinates: [-121.749, 38.543],
    fireIncidents: 2,
    hasAlarm: true,
    hasSprinkler: false,
    energyIntensity: 120,
    waterStrain: 30,
    gasStrain: 15,
    buildingAge: 50,
    buildingType: "academic",
    demographics: "30% elderly, 10% low-income",
  },
  {
    id: "shields",
    name: "Shields Library",
    coordinates: [-121.747, 38.541],
    fireIncidents: 0,
    hasAlarm: true,
    hasSprinkler: true,
    energyIntensity: 80,
    waterStrain: 20,
    gasStrain: 10,
    buildingAge: 40,
    buildingType: "library",
    demographics: "5% elderly, 20% low-income",
  },
];

export default function MapboxMap({
  style = "mapbox://styles/mapbox/streets-v12",
  center = [-121.7405, 38.5449], // Davis, CA coordinates
  zoom = 12,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add markers for each building
    demoBuildings.forEach((building) => {
      const el = document.createElement("div");
      el.className = "mapbox-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.background = "#2563eb";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";

      el.addEventListener("click", () => {
        setSelectedBuilding(building);
      });

      new mapboxgl.Marker(el)
        .setLngLat(building.coordinates)
        .addTo(map.current!);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [style, center, zoom]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-[500px] rounded-lg shadow-lg relative z-0" />
      {selectedBuilding && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={() => setSelectedBuilding(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <CompositeScore building={selectedBuilding} />
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setSelectedBuilding(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
