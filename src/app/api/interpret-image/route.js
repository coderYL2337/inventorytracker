// src/app/api/interpret-image/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY); // Debugging line to check if API key is loaded



export async function POST(request) {
  try {
    const { photo } = await request.json();
    const formats = ['jpeg', 'png', 'gif', 'webp'];
    const content = formats.map(format => ({
      type: "image_url",
      image_url: {
        url: `data:image/${format};base64,${photo}`
      }
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What’s in this image?Reply on the object name. For example, if you see a picture of apple, reply apple." },
            ...content,
          ],
        },
      ],
    });

    const itemName = response.choices[0].message.content;  // Adjust this according to the actual response structure

    return NextResponse.json({ itemName });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to interpret image' }, { status: 500 });
  }
}










