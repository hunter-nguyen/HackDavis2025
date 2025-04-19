"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";

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
