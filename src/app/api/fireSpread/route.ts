import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

const PROMPT = `You are a fire spread simulation API. Generate a realistic, irregular fire spread simulation for 3 hours.
Return ONLY a JSON string (no markdown, no explanations) in this exact format:

{
  "hours": [
    {
      "hour": 1,
      "coordinates": [
        [-0.00008, 0.00008],
        [-0.00008, 0.00004],
        [-0.00004, -0.00004],
        [-0.00004, -0.00008],
        [0.00004, -0.00008],
        [0.00008, -0.00004],
        [0.00008, 0.00004],
        [0.00004, 0.00008],
        [-0.00008, 0.00008]
      ]
    },
    {
      "hour": 2,
      "coordinates": [
        [-0.00015, 0.00015],
        [-0.00015, 0.00008],
        [-0.00008, -0.00008],
        [-0.00008, -0.00015],
        [0.00008, -0.00015],
        [0.00015, -0.00008],
        [0.00015, 0.00008],
        [0.00008, 0.00015],
        [-0.00015, 0.00015]
      ]
    },
    {
      "hour": 3,
      "coordinates": [
        [-0.0003, 0.0003],
        [-0.0003, 0.00015],
        [-0.00015, -0.00015],
        [-0.00015, -0.0003],
        [0.00015, -0.0003],
        [0.0003, -0.00015],
        [0.0003, 0.00015],
        [0.00015, 0.0003],
        [-0.0003, 0.0003]
      ]
    }
  ]
}

Rules for generating realistic fire spread:
1. Generate coordinates that spread evenly in all directions from the center point
2. Use equal positive and negative offsets to ensure the spread is centered
3. Make the shape slightly irregular but generally balanced
4. Each hour's polygon must grow outward from the center
5. Use small values (between 0.00001 and 0.0003) as these are coordinate offsets
6. First and last coordinate must be identical to close the polygon
7. Keep the spread pattern roughly symmetrical around the center point
8. Add subtle random variations while maintaining balance
9. Create small protrusions that extend equally in different directions
10. Keep the spread contained to a realistic building-sized area`;

export async function POST(req: Request) {
  try {
    const { building } = await req.json();
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `${PROMPT}

Building Context (use this to affect the fire spread pattern):
- Name: ${building.building_name}
- Location: [${building.longitude}, ${building.latitude}]
- Age: ${building.age || "Unknown"} years
- Size: ${building.size || "Medium"} square feet
- Primary Material: ${building.material || "Concrete and Steel"}
- Weather: Moderate wind from northwest

Make the fire spread pattern centered and balanced:
- Start from the building center point
- Spread evenly in all directions
- Use equal positive and negative offsets
- Keep the shape roughly symmetrical
- Add subtle variations while maintaining balance

Remember: Return ONLY the JSON string with no additional text or formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      // Try to parse the entire response as JSON first
      const fireSpread = JSON.parse(text);
      return NextResponse.json(fireSpread);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const fireSpread = JSON.parse(jsonMatch[0]);
      return NextResponse.json(fireSpread);
    }
  } catch (error) {
    console.error("Error generating fire spread:", error);
    return NextResponse.json(
      { error: "Failed to generate fire spread simulation" },
      { status: 500 }
    );
  }
}
