import { NextResponse } from 'next/server';

const NEXT_PUBLIC_NGROK_URL = process.env.NEXT_PUBLIC_NGROK_URL;


export async function POST(req: Request) {
    console.log(NEXT_PUBLIC_NGROK_URL);
  try {
    const body = await req.json();
    const { pieceName } = body;

    if (!pieceName) {
      return NextResponse.json({ error: "Missing pieceName in request" }, { status: 400 });
    }

    console.log(`Generating image for: ${pieceName} using Ngrok`);

    if (!NEXT_PUBLIC_NGROK_URL) {
      throw new Error("NGROK_URL environment variable is not set.");
    }

    const ngrokResponse = await fetch(`${NEXT_PUBLIC_NGROK_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: `A high-quality 3D render of a ${pieceName} chess piece, ultra-detailed, realistic, professional lighting, white piece against dark background, studio photography` }),
    });
    console.log(ngrokResponse);
    
    if (!ngrokResponse.ok) {
      const errorData = await ngrokResponse.json();
      throw new Error(`Ngrok/Colab API Error: ${ngrokResponse.status} - ${errorData?.error || ngrokResponse.statusText}`);
    }

    const imageData = await ngrokResponse.json();
    // Ensure we're returning in the expected format
    return NextResponse.json({ 
      output: Array.isArray(imageData.image) ? imageData.image : [imageData.image]
    });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}