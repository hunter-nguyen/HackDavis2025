'use server';

import fs from 'fs';
import path from 'path';
import { DormData, UCDDormData } from '@/lib/types'; 
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'; 

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