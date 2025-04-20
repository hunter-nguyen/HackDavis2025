"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
// CSS import moved to layout.tsx
import { DormData } from "@/lib/types";
import BuildingDataModal from "./BuildingDataModal";

interface MapboxMapProps {
  dorms: DormData[];
}

// Set Mapbox token safely
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = mapboxToken;

// Verify token is present in browser console
console.log("Mapbox token available:", !!mapboxToken);

export default function MapboxMap({ dorms }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedDorm, setSelectedDorm] = useState<DormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    
    // Check if Mapbox token is available
    if (!mapboxToken) {
      console.error("Mapbox access token is missing");
      setError("Missing Mapbox access token. Please check your .env file.");
      setLoading(false);
      return;
    }
    
    let map: mapboxgl.Map;
    try {
      // Create the map with a try-catch to handle initialization errors
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard",
        center: [-121.752, 38.5382],
        zoom: 14,
        attributionControl: true,
      });
      
      // Store the map reference
      mapRef.current = map;
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      
      // Handle map load event
      map.on('load', () => {
        console.log("Mapbox map loaded successfully");
        // Force a small delay to ensure style is fully loaded
        setTimeout(() => {
          // Force a resize to ensure map fills container
          map.resize();
          console.log("Map container dimensions:", 
            mapContainer.current?.clientWidth, 
            mapContainer.current?.clientHeight);
          setLoading(false);
        }, 1000);
      });
      
      // Handle map errors
      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError("Error loading map. Check console for details.");
        setLoading(false);
      });
    } catch (err) {
      console.error("Failed to initialize Mapbox map:", err);
      setError("Failed to initialize map. Check console for details.");
      setLoading(false);
      return;
    }
    
    // Cleanup function
    return () => {
      // Make a local copy for cleanup
      const currentMarkers = markersRef.current;
      currentMarkers.forEach((marker) => marker.remove());
      markersRef.current = [];
      
      // Clean up the map if it exists
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // add markers when dorms prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading || error) return;
    
    try {
      // Remove existing markers
      if (markersRef.current.length > 0) {
        const currentMarkers = markersRef.current;
        currentMarkers.forEach((marker) => marker.remove());
        markersRef.current = [];
      }
      
      // Skip if no dorms or empty array
      if (!dorms || dorms.length === 0) {
        console.log("No dorm data available to display on map");
        return;
      }
      
      // Add new markers
      dorms.forEach((dorm) => {
        // Skip dorms without coordinates
        if (dorm.latitude == null || dorm.longitude == null) {
          console.log(`Dorm ${dorm.building_name} is missing coordinates`);
          return;
        }
        
        try {
          // Create marker element
          const el = document.createElement("div");
          el.style.width = "24px";
          el.style.height = "24px";
          const score = dorm.fire_risk_score ?? 0;
          el.style.backgroundColor =
            score >= 90 ? "#FF0000" : score >= 70 ? "#EEA500" : "#006400";
          el.style.borderRadius = "50%";
          el.style.cursor = "pointer";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
          
          // Set click handler
          el.onclick = () => {
            setSelectedDorm(dorm);
            setIsModalOpen(true);
          };
          
          // Create and add marker
          const marker = new mapboxgl.Marker(el)
            .setLngLat([dorm.longitude, dorm.latitude])
            .addTo(map);
          
          // Track marker reference
          markersRef.current.push(marker);
        } catch (err) {
          console.error(`Error adding marker for ${dorm.building_name}:`, err);
        }
      });
    } catch (err) {
      console.error("Error managing markers:", err);
    }
  }, [dorms, loading, error]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* Map container with explicit inline styles */}
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          width: '100%', 
          height: '100%',
        }} 
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-20">
          <div className="p-4 rounded bg-white shadow-lg flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
            <p>Loading Mapbox map...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-20">
          <div className="text-red-600 p-4 rounded bg-white shadow-lg">
            <p className="font-bold mb-2">Error:</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Building info modal */}
      <BuildingDataModal
        building={selectedDorm}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
