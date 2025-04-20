import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini-pro
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { buildingInfo } = await req.json();
    
    // Initialize standard Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create the prompt that explicitly requests JSON only
    const prompt = `You are a JSON generator. Given this building information: "${buildingInfo}", generate 6 action plans for sustainability improvements. Output ONLY a JSON array. Do not include any markdown, text, or explanations.

    The response must be EXACTLY in this format (no other text):
    [{"title":"title1","description":"description1"},{"title":"title2","description":"description2"}]

    Make each plan specific, actionable, and focused on environmental impact and energy efficiency. Make the description also concise and less than or equal to 30 words.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the response into JSON
      const actionPlans = JSON.parse(text.trim());
      return NextResponse.json(actionPlans);
    } catch (parseError) {
      console.error('Error parsing JSON:', text);
      return NextResponse.json(
        { error: 'Failed to parse action plans response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating action plans:', error);
    return NextResponse.json(
      { error: 'Failed to generate action plans' },
      { status: 500 }
    );
  }
}