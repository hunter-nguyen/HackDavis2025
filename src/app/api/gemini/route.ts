import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DormFireSafety } from '@/lib/types';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to create the prompt for Gemini
function createFireSafetyPrompt(fireSafety: DormFireSafety, numDrills: number, buildingName: string): string {
  return `Based on the following fire safety features for the building "${buildingName}":

Sprinklers: ${fireSafety.sprinkler.full ? 'Full' : fireSafety.sprinkler.partial ? 'Partial' : 'None'}
Smoke Alarms: ${fireSafety.alarm.smoke ? 'Yes' : 'No'}
Duct Alarms: ${fireSafety.alarm.duct ? 'Yes' : 'No'}
Manual Pull Stations: ${fireSafety.alarm.manual_pull ? 'Yes' : 'No'}
Evacuation Devices: ${fireSafety.alarm.evac_device ? 'Yes' : 'No'}
Corridor Fire Separation: ${fireSafety.fire_separation.corridor ? 'Yes' : 'No'}
Room Fire Separation: ${fireSafety.fire_separation.room ? 'Yes' : 'No'}
Number of Fire Drills/Year: ${numDrills}

Provide a detailed analysis of the fire safety situation in this building. Include:

1. A fire risk score between 0 (very safe) and 100 (very high risk)
2. A detailed explanation of the risk assessment
3. Three specific, actionable recommendations to improve fire safety
4. A brief explanation of why each recommendation is important

Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed text explanation",
  "recommendations": [
    {
      "action": "specific action to take",
      "reason": "why this is important"
    },
    ...
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { fireSafety, numFireDrills, buildingName } = body;
    
    // Validate required fields
    if (!fireSafety || numFireDrills === undefined || !buildingName) {
      return NextResponse.json(
        { error: 'Missing required fields: fireSafety, numFireDrills, or buildingName' },
        { status: 400 }
      );
    }

    // Create the prompt
    const prompt = createFireSafetyPrompt(fireSafety, numFireDrills, buildingName);
    
    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Try to parse the response as JSON
    try {
      const jsonResponse = JSON.parse(text);
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      // Return the raw text if JSON parsing fails
      return NextResponse.json({ rawResponse: text });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
