"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDormData } from '@/server/actions';
import { UCDDormData } from '@/lib/types';

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapboxMapProps {
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export default function MapboxMap({
  style = "mapbox://styles/mapbox/streets-v12",
  center = [-121.7405, 38.5449], // Davis, CA coordinates
  zoom = 12,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [dormData, setDormData] = useState<UCDDormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [style, center, zoom]);

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

  useEffect(() => {
    // Ensure map is initialized and dormData is loaded (it's an array)
    if (!map.current || !dormData || dormData.length === 0) return;

    // Clear existing markers if any (e.g., on data refresh, though not applicable here)
    // This logic might be needed if data could change dynamically

    // dormData is the array directly, not an object with a 'dorms' property
    dormData.forEach(dorm => {
      // Check if geocoding was successful and coordinates exist
      if (dorm.latitude !== undefined && dorm.longitude !== undefined) {
        const marker = new mapboxgl.Marker()
          .setLngLat([dorm.longitude, dorm.latitude])
          .setPopup(new mapboxgl.Popup({ offset: 25 }) // Adjust offset slightly
            .setHTML(
              `<div style="color: black;">
                <h3>${dorm.building_name}</h3>
                <p><strong>Address:</strong> ${dorm.address}</p>
                <h4>Fire Safety:</h4>
                <ul>
                  <li>Sprinklers: ${dorm.fire_safety.sprinkler.full ? 'Full' : dorm.fire_safety.sprinkler.partial ? 'Partial' : 'None'}</li>
                  <li>Smoke Alarms: ${dorm.fire_safety.alarm.smoke ? 'Yes' : 'No'}</li>
                  <li>Manual Pull Stations: ${dorm.fire_safety.alarm.manual_pull ? 'Yes' : 'No'}</li>
                </ul>
                <h4>Utilities (Usage/Month):</h4>
                <ul>
                  <li>Electricity: ${dorm.electricity ?? 'N/A'} kWh</li>
                  <li>Steam: ${dorm.steam ?? 'N/A'} lbs</li>
                  <li>Chilled Water: ${dorm.chilled_water ?? 'N/A'} Ton-Hrs</li>
                  <li>Domestic Water: ${dorm.domestic_water ?? 'N/A'} Gallons</li>
                </ul>
                <p><em>Num Fire Drills: ${dorm.num_fire_drills}</em></p>
              </div>`
            ))
          .addTo(map.current!);
      }
    });

  }, [dormData]); // Remove map.current from dependencies

  if (loading) {
    return <div className="w-full h-[500px] flex justify-center items-center">Loading map data...</div>;
  }

  if (error) {
    return <div className="w-full h-[500px] flex justify-center items-center text-red-500">Error: {error}</div>;
  }

  return (
    <div ref={mapContainer} className="w-full h-[500px] rounded-lg shadow-lg" />
  );
}
