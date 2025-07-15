import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return NextResponse.json({
      error: 'No Gemini API key configured. Please set GEMINI_API_KEY in your environment.'
    }, { status: 500 });
  }

  // Prompt Gemini to extract structured data from the OCR text
  const prompt = `
You are an expert at reading receipts and extracting structured data for expense tracking. Given the following receipt text, extract:
- amount (number, in INR)
- date (YYYY-MM-DD)
- category (choose from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Groceries, Other)
- description (short summary)
- period (weekly, monthly, or yearly; guess based on context or leave blank if unknown)

Return the result as a JSON object with keys: amount, date, category, description, period. Only output the JSON, nothing else.

Receipt text:
"""
${text}
"""
`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 512,
        }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Gemini API error', details: await response.json() }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to parse the JSON from Gemini's response
    let extracted = null;
    try {
      extracted = JSON.parse(raw);
    } catch (err) {
      // Try to extract JSON from text if Gemini adds extra text
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        extracted = JSON.parse(match[0]);
      }
    }
    if (!extracted) {
      return NextResponse.json({ error: 'Failed to parse Gemini response', raw }, { status: 500 });
    }
    return NextResponse.json(extracted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract details with Gemini', details: String(error) }, { status: 500 });
  }
} 