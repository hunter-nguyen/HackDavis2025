'use server';

import fs from 'fs';
import path from 'path';
import { UCDDormData } from '@/lib/types';

/**
 * Server action to read and return the UC Davis dorm data
 * @returns Promise containing the dorm data
 */
export async function getDormData(): Promise<UCDDormData> {
  try {
    // Get the absolute path to the data file
    const dataFilePath = path.join(process.cwd(), 'data', 'ucd_combined_dorm_data.json');
    
    // Read the file
    const fileContents = await fs.promises.readFile(dataFilePath, 'utf8');
    
    // Parse the JSON data
    const dormData: UCDDormData = JSON.parse(fileContents);
    
    return dormData;
  } catch (error) {
    console.error('Error reading dorm data:', error);
    throw new Error('Failed to load dorm data');
  }
}