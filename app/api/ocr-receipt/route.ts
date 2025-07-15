import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Ensure Node.js runtime for file handling

export async function POST(req: NextRequest) {
  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Read file as buffer
  const arrayBuffer = await (file as Blob).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Prepare form data for OCR.Space
  const ocrForm = new FormData();
  ocrForm.append('file', new Blob([buffer]), 'receipt.jpg');
  ocrForm.append('language', 'eng');
  ocrForm.append('isOverlayRequired', 'false');
  // You can use 'helloworld' as a free API key for testing, or get your own from https://ocr.space/ocrapi
  ocrForm.append('apikey', 'helloworld');

  try {
    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrForm,
    });
    const ocrData = await ocrRes.json();
    const text = ocrData?.ParsedResults?.[0]?.ParsedText || '';
    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR.Space error:', error);
    return NextResponse.json({ error: 'Failed to extract text from image' }, { status: 500 });
  }
} 