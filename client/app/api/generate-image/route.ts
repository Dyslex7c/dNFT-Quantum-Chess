import { NextResponse } from "next/server";

const NEXT_PUBLIC_REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const NEXT_PUBLIC_STABLE_DIFFUSION_MODEL = process.env.STABLE_DIFFUSION_MODEL;

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { pieceName } = body;
    
    if (!pieceName) {
      return NextResponse.json({ error: "Missing pieceName in request" }, { status: 400 });
    }
    
    console.log(`Generating image for: ${pieceName}`);

    // Create prediction
    const prediction = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${NEXT_PUBLIC_REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: NEXT_PUBLIC_STABLE_DIFFUSION_MODEL,
        input: {
          prompt: `A high-quality 3D render of a ${pieceName} chess piece, ultra-detailed, realistic, professional lighting, white piece against dark background, studio photography`,
          width: 768,
          height: 768,
          num_outputs: 1,
        },
      }),
    });

    const responseData = await prediction.json();
    
    if (!prediction.ok) {
      console.error("Replicate API error:", responseData);
      return NextResponse.json(
        { error: responseData.detail || "Failed to generate image" }, 
        { status: prediction.status }
      );
    }
    
    // For Replicate, we need to poll until the prediction is complete
    const { id } = responseData;
    let result = await checkPredictionStatus(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

async function checkPredictionStatus(id: string, maxAttempts = 20) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to check prediction status");
    }
    
    const data = await response.json();
    
    if (data.status === "succeeded") {
      return data;
    } else if (data.status === "failed") {
      throw new Error(data.error || "Image generation failed");
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error("Timed out waiting for image generation");
}