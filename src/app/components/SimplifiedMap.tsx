"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { DormData } from "@/lib/types";
import BuildingDataModal from "./BuildingDataModal";
import { getDormData } from "@/server/actions";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = mapboxToken;

// Colors for different risk levels - matching BuildingDataModal
const RISK_COLORS = {
  HIGH: "#EF4444",    // Red - High risk
  MEDIUM: "#F59E0B",  // Amber - Medium risk
  LOW: "#10B981"      // Green - Low risk
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
        center: [-121.752, 38.5382],
        zoom: 14,
      });
      
      map.current = newMap;
      
      newMap.on('load', () => {
        console.log("Map loaded successfully");
        setLoading(false);
      });
      
      newMap.on('error', (e) => {
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
        markersRef.current.forEach(marker => marker.remove());
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
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
    
    // Add markers for each dorm
    dorms.forEach(dorm => {
      if (!dorm.latitude || !dorm.longitude) {
        console.log(`Dorm ${dorm.building_name} missing coordinates`);
        return;
      }
      
      // Get color based on risk score - matching BuildingDataModal calculation
      const safetyScore = dorm.fire_risk_score ?? 50;
      const safetyPercentage = 100 - safetyScore; // Invert so higher is safer (same as modal)
      
      // Use the same color logic as BuildingDataModal
      const markerColor = safetyPercentage >= 70 ? RISK_COLORS.LOW : 
                          safetyPercentage >= 40 ? RISK_COLORS.MEDIUM : 
                          RISK_COLORS.HIGH;
      
      // Create color-coded Mapbox marker
      const marker = new mapboxgl.Marker({
        color: markerColor
      })
        .setLngLat([dorm.longitude, dorm.latitude])
        .addTo(currentMap);
        
      // Add click handler
      marker.getElement().addEventListener('click', () => {
        console.log("Marker clicked:", dorm.building_name);
        setSelectedDorm(dorm);
        setIsModalOpen(true);
      });
      
      // Store marker reference
      markersRef.current.push(marker);
    });
    
    console.log("Added", markersRef.current.length, "markers");
  }, [dorms, loading]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'white',
          zIndex: 10
        }}>
          <div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 2s linear infinite',
              margin: '0 auto 20px auto'
            }}></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.9)',
          zIndex: 10
        }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            color: '#e53e3e'
          }}>
            <p>Error: {error}</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          backgroundColor: '#f0f0f0'
        }}
      />
      
      <BuildingDataModal
        building={selectedDorm}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
