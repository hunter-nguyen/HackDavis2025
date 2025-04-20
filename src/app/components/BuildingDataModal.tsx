"use client";

import React from "react";
import { DormData } from "@/lib/types";
import { X, AlertTriangle, Shield, Flame, CheckCircle, XCircle } from "lucide-react";

interface BuildingDataModalProps {
  building: DormData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BuildingDataModal({
  building,
  isOpen,
  onClose,
}: BuildingDataModalProps) {
  if (!isOpen || !building) return null;

  // Calculate safety score percentage for the gauge
  const safetyScore = building.fire_risk_score !== undefined ? building.fire_risk_score : 50;
  const safetyPercentage = 100 - safetyScore; // Invert so higher is safer
  
  // Determine color based on safety score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "#10B981"; // Green for safe
    if (score >= 40) return "#F59E0B"; // Amber for medium risk
    return "#EF4444"; // Red for high risk
  };
  
  const scoreColor = getScoreColor(safetyPercentage);
  
  // Format safety features for display
  const safetyFeatures = [
    { 
      name: "Sprinkler System", 
      value: building.fire_safety.sprinkler.full ? "Full" : building.fire_safety.sprinkler.partial ? "Partial" : "None",
      status: building.fire_safety.sprinkler.full ? "good" : building.fire_safety.sprinkler.partial ? "partial" : "bad"
    },
    { 
      name: "Smoke Alarms", 
      value: building.fire_safety.alarm.smoke ? "Installed" : "Missing",
      status: building.fire_safety.alarm.smoke ? "good" : "bad"
    },
    { 
      name: "Manual Pull Stations", 
      value: building.fire_safety.alarm.manual_pull ? "Installed" : "Missing",
      status: building.fire_safety.alarm.manual_pull ? "good" : "bad"
    },
    { 
      name: "Evacuation Devices", 
      value: building.fire_safety.alarm.evac_device ? "Installed" : "Missing",
      status: building.fire_safety.alarm.evac_device ? "good" : "bad"
    },
    { 
      name: "Fire Drills Per Year", 
      value: building.num_fire_drills.toString(),
      status: building.num_fire_drills >= 2 ? "good" : building.num_fire_drills >= 1 ? "partial" : "bad"
    },
  ];

  // Parse action steps
  const actionSteps = building.action_steps ? building.action_steps.split('\n').map(step => step.trim()).filter(Boolean) : [];

  return (
    <div 
      className={`fixed left-0 top-0 bottom-0 w-[400px] bg-white shadow-xl z-40 overflow-auto transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>

      {/* Header with building info */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{building.building_name}</h2>
        <p className="text-sm text-gray-600">{building.address}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Safety Score Gauge - Made more compact */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center">
          <div className="relative inline-block w-20 h-20 flex-shrink-0">
            {/* Circular background */}
            <div className="absolute inset-0 rounded-full border-6 border-gray-200"></div>
            
            {/* Progress arc - using SVG for better control */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={`${safetyPercentage * 2.51} 251`} // 2.51 is approx 2*PI*40
              />
            </svg>
            
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: scoreColor }}>
                {safetyPercentage}
              </span>
              <span className="text-[10px] text-gray-500">Score</span>
            </div>
          </div>
          
          <div className="ml-4">
            <h3 className="text-md font-semibold">Fire Safety Score</h3>
            {/* Risk level indicator */}
            <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs" 
              style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {safetyPercentage >= 70 ? "Low Risk" : safetyPercentage >= 40 ? "Medium Risk" : "High Risk"}
            </div>
          </div>
        </div>

        {/* Safety Features - More compact */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3">Safety Features</h3>
          <div className="grid grid-cols-2 gap-2">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                <span className="text-gray-700 text-xs">{feature.name}</span>
                <div className="flex items-center ml-1">
                  {feature.status === "good" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {feature.status === "partial" && <Shield className="h-4 w-4 text-amber-500" />}
                  {feature.status === "bad" && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utility Data - More compact */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3">Utility Usage</h3>
          {(building.electricity !== null || 
            building.steam !== null || 
            building.chilled_water !== null || 
            building.domestic_water !== null) ? (
            <div className="grid grid-cols-2 gap-2">
              {building.electricity !== null && (
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">Electricity</div>
                  <div className="text-xs font-semibold">{building.electricity.toLocaleString()} kWh</div>
                </div>
              )}
              {building.steam !== null && (
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">Steam</div>
                  <div className="text-xs font-semibold">{building.steam.toLocaleString()} MMBtu</div>
                </div>
              )}
              {building.chilled_water !== null && (
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">Chilled Water</div>
                  <div className="text-xs font-semibold">{building.chilled_water.toLocaleString()} MMBtu</div>
                </div>
              )}
              {building.domestic_water !== null && (
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <div className="text-xs text-gray-500">Water</div>
                  <div className="text-xs font-semibold">{building.domestic_water.toLocaleString()} kgal</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2 text-gray-500 text-xs">
              <p>No utility data available</p>
            </div>
          )}
        </div>

        {/* Action Steps - More compact */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3 flex items-center">
            <Flame className="h-4 w-4 mr-1 text-red-500" />
            Recommended Actions
          </h3>
          {actionSteps.length > 0 ? (
            <ul className="space-y-2">
              {actionSteps.map((step, index) => (
                <li key={index} className="flex bg-white p-2 rounded-md shadow-sm">
                  <div className="flex-shrink-0 h-4 w-4 rounded-full bg-red-100 flex items-center justify-center mr-2">
                    <span className="text-[10px] font-medium text-red-600">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 text-xs">{step.replace(/^-\s*/, '')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-2 text-gray-500 text-xs">
              <p>No action steps available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
