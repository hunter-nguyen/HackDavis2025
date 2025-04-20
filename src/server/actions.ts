'use server';

import fs from 'fs';
import path from 'path';
import { DormData, DormFireSafety, UCDDormData } from '@/lib/types'; 
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'; 
import { GoogleGenerativeAI } from "@google/generative-ai";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  throw new Error('Mapbox access token is not configured.');
}
const geocodingClient = mbxGeocoding({ accessToken: mapboxToken });

// Helper function to generate the prompt for Gemini
function createFireRiskPrompt(fireSafety: DormFireSafety, numDrills: number): string {
  return `Based on the following fire safety features for a dorm building:
Sprinklers: ${fireSafety.sprinkler.full ? 'Full' : fireSafety.sprinkler.partial ? 'Partial' : 'None'}
Smoke Alarms: ${fireSafety.alarm.smoke ? 'Yes' : 'No'}
Duct Alarms: ${fireSafety.alarm.duct ? 'Yes' : 'No'}
Manual Pull Stations: ${fireSafety.alarm.manual_pull ? 'Yes' : 'No'}
Evacuation Devices: ${fireSafety.alarm.evac_device ? 'Yes' : 'No'}
Corridor Fire Separation: ${fireSafety.fire_separation.corridor ? 'Yes' : 'No'}
Room Fire Separation: ${fireSafety.fire_separation.room ? 'Yes' : 'No'}
Number of Fire Drills/Year: ${numDrills}

Generate a fire risk score between 0 (very safe) and 100 (very high risk).
Also provide a short, actionable list of steps (max 3 bullet points) to improve fire safety.
Format the output EXACTLY like this, with no extra text before or after:
Score: [score_number]
Steps:
- [Step 1]
- [Step 2]
...`;
}

// Helper function to parse the Gemini response
function parseFireRiskResponse(responseText: string): { score: number | undefined; steps: string | undefined } {
  const scoreMatch = responseText.match(/Score:\s*(\d+)/);
  const stepsMatch = responseText.match(/Steps:\s*\n([\s\S]*)/); // Match everything after "Steps:\n"

  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : undefined;
  const steps = stepsMatch ? stepsMatch[1].trim() : undefined; // Trim whitespace

  // Basic validation
  if (score === undefined || isNaN(score) || score < 0 || score > 100 || steps === undefined) {
      console.warn("Could not parse score/steps reliably from response:", responseText);
      return { score: undefined, steps: undefined };
  }

  return { score, steps };
}


/**
 * Server action to read, geocode, calculate fire risk, and return the UC Davis dorm data
 * @returns Promise containing the enhanced dorm data
 */
export async function getDormData(): Promise<UCDDormData> {
  try {
    const dataFilePath = path.join(process.cwd(), 'data', 'ucd_combined_dorm_data.json');
    const fileContents = await fs.promises.readFile(dataFilePath, 'utf8');
    const dorms: DormData[] = JSON.parse(fileContents);

    const enhancedDorms = await Promise.all(
      dorms.map(async (dorm) => {
        let latitude: number | undefined = undefined;
        let longitude: number | undefined = undefined;
        let fire_risk_score: number | undefined = undefined;
        let action_steps: string | undefined = undefined;

        // 1. Geocode
        try {
          const response = await geocodingClient
            .forwardGeocode({ query: dorm.address, limit: 1 })
            .send();

          if (response?.body?.features?.length > 0) {
            [longitude, latitude] = response.body.features[0].center;
          } else {
            console.warn(`Geocoding failed for address: ${dorm.address}`);
          }
        } catch (geoError) {
          console.error(`Error geocoding address ${dorm.address}:`, geoError);
        }

        // 2. Calculate Fire Risk Score & Steps
        try {
          const prompt = createFireRiskPrompt(dorm.fire_safety, dorm.num_fire_drills);
          const riskResponse = await getFireRiskScore(prompt); // Use the existing function
          const parsedData = parseFireRiskResponse(riskResponse);
          fire_risk_score = parsedData.score;
          action_steps = parsedData.steps;
          if (!fire_risk_score || !action_steps) {
             console.warn(`Failed to get/parse fire risk for ${dorm.building_name}`);
          }
        } catch (riskError) {
           console.error(`Error getting fire risk for ${dorm.building_name}:`, riskError);
        }


        // Return the dorm object with all available data
        return {
          ...dorm,
          latitude,
          longitude,
          fire_risk_score,
          action_steps
        };
      })
    );

    return enhancedDorms;
  } catch (error) {
    console.error('Error processing dorm data:', error); // Updated error message
    throw new Error('Failed to load, geocode, or process dorm data');
  }
}

export async function getFireRiskScore(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is missing.");
      throw new Error("Gemini API key is not configured.");
    }
    // Log to help debug API key issues
    // console.log("Using Gemini API with key length:", apiKey.length); // Commented out for security

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated model

    // console.log("Attempting to use model: gemini-1.5-flash"); // Optional logging

    const result = await model.generateContent(prompt);

    // Check if we have a valid response object
    if (!result.response) {
      // We know result.response is undefined here, so we cannot access properties on it.
      // Log a generic error message. Specific block reasons might be available elsewhere if needed.
      console.error("Gemini API response error: No response object received.");
      throw new Error(`No response object from Gemini API.`);
    }

    // If we are here, result.response exists. Now check for potential issues reported *in* the response.
    const response = result.response; // Assign to a variable for clarity
    const responseText = response.text(); // Now safe to call text()

    // Check if the response was blocked or had other issues
    if (response.promptFeedback?.blockReason) {
      console.error(`Gemini API request blocked. Reason: ${response.promptFeedback.blockReason}`, response.promptFeedback);
      throw new Error(`Gemini API request failed or was blocked. Reason: ${response.promptFeedback.blockReason}`);
    }


    return responseText; // Return the text content
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Propagate a more informative error message
    const message = error instanceof Error ? error.message : 'Unknown error during Gemini API call';
    throw new Error(`Failed to generate score: ${message}`);
  }
}