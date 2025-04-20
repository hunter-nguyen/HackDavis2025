"use client";

import React, { useState } from "react";
import { DormData } from "@/lib/types";
import { X, AlertTriangle, Shield, Flame, CheckCircle, XCircle, Building, Activity, Info } from "lucide-react";
import { getScoreColor } from "@/lib/utils";

interface BuildingDataModalProps {
  building: DormData | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'safety' | 'building' | 'action';

export default function BuildingDataModal({
  building,
  isOpen,
  onClose,
}: BuildingDataModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('safety');

  if (!isOpen || !building) return null;

  // Calculate safety score percentage for the gauge
  const safetyScore = building.fire_risk_score !== undefined ? building.fire_risk_score : 50;
  const scoreColor = getScoreColor(safetyScore);
  
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
      className={`fixed left-0 top-0 bottom-0 w-[400px] bg-white shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button 
          className={`flex-1 py-3 px-2 text-center font-medium text-sm transition-colors ${activeTab === 'safety' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('safety')}
        >
          <Shield className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
          Safety Details
        </button>
        <button 
          className={`flex-1 py-3 px-2 text-center font-medium text-sm transition-colors ${activeTab === 'building' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('building')}
        >
          <Building className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
          Building Info
        </button>
        <button 
          className={`flex-1 py-3 px-2 text-center font-medium text-sm transition-colors ${activeTab === 'action' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('action')}
        >
          <AlertTriangle className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
          Action Plan
        </button>
      </div>

      {/* Building info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">{building.building_name}</h2>
        <p className="text-sm text-gray-600">{building.address}</p>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {/* Safety Details Tab */}
        {activeTab === 'safety' && (
          <div className="p-4 space-y-4">
            {/* Fire Safety Score */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="relative inline-block w-24 h-24 flex-shrink-0">
                  {/* Circular background */}
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  
                  {/* Progress arc */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent"
                      stroke={safetyScore >= 70 ? '#EF4444' : safetyScore >= 40 ? '#F59E0B' : '#10B981'}
                      strokeWidth="8"
                      strokeDasharray={`${safetyScore * 2.51} 251`} // 2.51 is approx 2*PI*40
                    />
                  </svg>
                  
                  {/* Score text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: safetyScore >= 70 ? '#EF4444' : safetyScore >= 40 ? '#F59E0B' : '#10B981' }}>
                      {safetyScore}
                    </span>
                    <span className="text-xs text-gray-500">Risk</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Fire Risk Score</h3>
                  {/* Risk level indicator */}
                  <div className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-sm" 
                    style={{ 
                      backgroundColor: safetyScore >= 70 ? 'rgba(239, 68, 68, 0.1)' : safetyScore >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                      color: safetyScore >= 70 ? '#EF4444' : safetyScore >= 40 ? '#F59E0B' : '#10B981'
                    }}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    {safetyScore >= 70 ? "High Risk" : safetyScore >= 40 ? "Medium Risk" : "Low Risk"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Last updated Apr 20, 2025</div>
                </div>
              </div>
            </div>

            {/* Safety Features */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Safety Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {safetyFeatures.map((feature, index) => (
                  <div key={index} className="flex flex-col bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{feature.name}</span>
                      <div>
                        {feature.status === "good" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {feature.status === "partial" && <Shield className="h-4 w-4 text-amber-500" />}
                        {feature.status === "bad" && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium">{feature.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Annual Drill Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h3 className="text-md font-medium text-gray-800">Annual Drill Status</h3>
                  <p className="text-sm text-gray-600">Required: 2 per year</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{building.num_fire_drills}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full ${building.num_fire_drills >= 2 ? 'bg-green-500' : building.num_fire_drills >= 1 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(building.num_fire_drills / 2 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Building Info Tab */}
        {activeTab === 'building' && (
          <div className="p-4 space-y-4">
            {/* Building Information */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Building Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Building Type</div>
                  <div className="text-sm font-medium">Residential</div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Construction</div>
                  <div className="text-sm font-medium">Standard</div>
                </div>
              </div>
            </div>

            {/* Utility Usage */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Utility Usage</h3>
              {(building.electricity !== null || 
                building.steam !== null || 
                building.chilled_water !== null || 
                building.domestic_water !== null) ? (
                <div className="grid grid-cols-2 gap-3">
                  {building.electricity !== null && (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Electricity</div>
                      <div className="text-sm font-medium text-red-600">{(building.electricity/1000).toFixed(1)}k kWh</div>
                    </div>
                  )}
                  {building.steam !== null && (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Steam</div>
                      <div className="text-sm font-medium text-red-600">{building.steam.toLocaleString()} MMBtu</div>
                    </div>
                  )}
                  {building.chilled_water !== null && (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Chilled Water</div>
                      <div className="text-sm font-medium text-red-600">{building.chilled_water.toLocaleString()} MMBtu</div>
                    </div>
                  )}
                  {building.domestic_water !== null && (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Water</div>
                      <div className="text-sm font-medium text-red-600">{building.domestic_water.toLocaleString()} kgal</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                  <p className="text-gray-500">No utility data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Plan Tab */}
        {activeTab === 'action' && (
          <div className="p-4 space-y-4">
            <h3 className="text-md font-medium text-gray-800 flex items-center">
              <Flame className="w-4 h-4 mr-2 text-red-500" />
              Recommended Actions
            </h3>

            {actionSteps.length > 0 ? (
              <div className="space-y-3">
                {actionSteps.map((step, index) => (
                  <div key={index} className="flex bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-red-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step.replace(/^-\s*/, '')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">No action steps available</p>
              </div>
            )}

            {/* Compliance Timeline */}
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Compliance Timeline</h3>
              <div className="relative pb-1">
                {/* Timeline visualization */}
                <div className="absolute left-2.5 top-2 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* Timeline items */}
                <div className="relative flex items-start mb-4">
                  <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center z-10 text-xs font-medium">1</div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-800">Initial Assessment</div>
                    <div className="text-xs text-gray-500">Due within 7 days</div>
                  </div>
                </div>
                
                <div className="relative flex items-start mb-4">
                  <div className="h-5 w-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center z-10 text-xs font-medium">2</div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-800">Implementation Plan</div>
                    <div className="text-xs text-gray-500">Due within 30 days</div>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="h-5 w-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center z-10 text-xs font-medium">3</div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-800">Compliance Verification</div>
                    <div className="text-xs text-gray-500">Due within 90 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with branding */}
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
        <div>Last updated: {new Date().toLocaleDateString()}</div>
        <div className="flex items-center">
          <Info className="w-3 h-3 mr-1" /> 
          <span>FireZero</span>
        </div>
      </div>
    </div>
  );
}
