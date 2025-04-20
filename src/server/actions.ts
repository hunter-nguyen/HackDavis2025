'use server';

import fs from 'fs';
import path from 'path';
import { DormData, UCDDormData } from '@/lib/types'; 
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'; 
import { GoogleGenerativeAI } from "@google/generative-ai";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  throw new Error('Mapbox access token is not configured.');
}
const geocodingClient = mbxGeocoding({ accessToken: mapboxToken });

/**
 * Server action to read, geocode, and return the UC Davis dorm data
 * @returns Promise containing the geocoded dorm data
 */
export async function getDormData(): Promise<UCDDormData> {
  try {
    // Get the absolute path to the data file
    const dataFilePath = path.join(process.cwd(), 'data', 'ucd_combined_dorm_data.json');

    // Read the file
    const fileContents = await fs.promises.readFile(dataFilePath, 'utf8');

    // Parse the JSON data
    const dorms: DormData[] = JSON.parse(fileContents);

    // Geocode each dorm address
    const geocodedDorms = await Promise.all(
      dorms.map(async (dorm) => {
        try {
          const response = await geocodingClient
            .forwardGeocode({ query: dorm.address, limit: 1 })
            .send();

          if (response && response.body && response.body.features && response.body.features.length > 0) {
            const [longitude, latitude] = response.body.features[0].center;
            return { ...dorm, latitude, longitude };
          } else {
            console.warn(`Geocoding failed for address: ${dorm.address}`);
            return dorm; // Return original dorm data if geocoding fails
          }
        } catch (geoError) {
          console.error(`Error geocoding address ${dorm.address}:`, geoError);
          return dorm; // Return original dorm data on error
        }
      })
    );

    return geocodedDorms;
  } catch (error) {
    console.error('Error reading or geocoding dorm data:', error);
    throw new Error('Failed to load or geocode dorm data');
  }
}

export async function getFireRiskScore(prompt: string): Promise<string> {
  try {
    // Log to help debug API key issues
    console.log("Using Gemini API with key length:", process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0);
    
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    
    // Use gemini-2.0-flash model as shown in the curl example
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("Attempting to use model: gemini-2.0-flash");
    
    // Generate content with simpler configuration
    const result = await model.generateContent(prompt);
    
    // Check if we have a valid response
    if (!result.response) {
      throw new Error("No response from Gemini API");
    }
    
    return result.response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to generate score: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}