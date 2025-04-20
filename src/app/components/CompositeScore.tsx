"use client";

import React, { useState } from "react";
import { getFireRiskScore } from "@/server/actions";

interface BuildingData {
  fireIncidents: number;
  hasAlarm: boolean;
  hasSprinkler: boolean;
  energyIntensity: number; // kWh/sqft
  waterStrain: number;
  gasStrain: number;
  buildingAge: number;
  buildingType: string;
  demographics: string; // e.g., "% elderly, % low-income"
  name: string;
}

const buildPrompt = (data: BuildingData) => `You are an expert in fire safety analytics and environmental justice. Given the following data for a specific building, generate:

1. A composite fire resilience risk score (0-100, where 100 is most resilient).
2. A brief explanation for the score.
3. 2-3 actionable steps the building or its occupants should take to improve fire resilience, prioritizing support for vulnerable or marginalized communities if applicable.

Building Data:
- Number of fire incidents (from Clery data): ${data.fireIncidents}
- Presence of fire alarm system: ${data.hasAlarm ? "Yes" : "No"}
- Presence of sprinkler system: ${data.hasSprinkler ? "Yes" : "No"}
- Energy intensity (kWh/sqft, from CEED): ${data.energyIntensity}
- Water strain (usage per capita, from CEED): ${data.waterStrain}
- Gas strain (usage per capita, from CEED): ${data.gasStrain}
- Age of building (years, if available): ${data.buildingAge}
- Type of building (residential, academic, etc.): ${data.buildingType}
- Demographic overlays (e.g., % low-income, % elderly, % disabled, % non-English speakers): ${data.demographics}

Instructions:
- Weigh recent fire incidents and lack of safety systems as major risk factors.
- Consider high energy/water/gas usage as indicators of strain or vulnerability.
- Factor in building age/type and demographic vulnerability (e.g., prioritize support for communities with higher percentages of marginalized groups).
- Output the risk score, a concise rationale, and actionable steps tailored to the building’s context.
`;

interface CompositeScoreProps {
  building: BuildingData;
}

const CompositeScore: React.FC<CompositeScoreProps> = ({ building }) => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null); // Clear previous results
    const prompt = buildPrompt(building);
    
    try {
      console.log("Sending prompt to Gemini API...");
      const response = await getFireRiskScore(prompt);
      console.log("Received response from Gemini API");
      setResult(response);
    } catch (error) {
      console.error("Error in CompositeScore:", error);
      setResult(`Error generating score: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract score from result text if available
  const extractScore = (text: string): number | null => {
    const scoreMatch = text.match(/([0-9]{1,3})(\/100|\s*\/\s*100)/);
    return scoreMatch && scoreMatch[1] ? parseInt(scoreMatch[1]) : null;
  };

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white max-w-xl mx-auto my-4">
      <h2 className="font-bold text-lg mb-4 text-gray-800">Fire Resilience Composite Score for {building.name}</h2>
      <button
        type="button"
        onClick={handleGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={loading}
        aria-busy={loading}
        aria-label={`Generate fire resilience score for ${building.name}`}
      >
        {loading ? "Generating..." : "Generate Score"}
      </button>
      
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Analyzing building data...</p>
        </div>
      )}
      
      {!loading && result && (
        <div className={`mt-4 rounded border ${result.includes("Error") ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-gray-800"}`}>
          {result.includes("Error") ? (
            <pre className="whitespace-pre-wrap text-sm font-sans p-4">{result}</pre>
          ) : (
            <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {/* Score display */}
              {(() => {
                const score = result ? extractScore(result) : null;
                if (score !== null) {
                  return (
                    <div className="mb-4 flex items-center">
                      <div className="text-4xl font-bold mr-3">{score}</div>
                      <div className="text-xl">/100</div>
                      <div className="ml-auto">
                        <div className={`h-8 w-8 rounded-full ${getScoreColor(score)}`}></div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Formatted content */}
              <div className="prose prose-sm max-w-none">
                {result.split('\n\n').map((paragraph, i) => {
                  // Header (bold text)
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return <h3 key={i} className="font-bold text-lg mt-4 mb-2">{paragraph.replace(/\*\*/g, '')}</h3>;
                  }
                  // Bullet point
                  else if (paragraph.startsWith('*   ')) {
                    return (
                      <div key={i} className="ml-4 mb-3">
                        <div className="flex">
                          <span className="mr-2">•</span>
                          <div>{paragraph.replace('*   ', '')}</div>
                        </div>
                      </div>
                    );
                  }
                  // Regular paragraph
                  else {
                    return <p key={i} className="mb-3">{paragraph}</p>;
                  }
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompositeScore;
