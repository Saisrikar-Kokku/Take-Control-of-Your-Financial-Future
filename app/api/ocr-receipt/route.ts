import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Ensure Node.js runtime for file handling

export async function POST(req: NextRequest) {
  try {
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
    // Use personal API key if available, fallback to 'helloworld'
    const ocrApiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    ocrForm.append('apikey', ocrApiKey);

    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrForm,
    });
    const ocrData = await ocrRes.json();
    if (!ocrRes.ok || ocrData.IsErroredOnProcessing) {
      return NextResponse.json({ error: 'OCR.Space error', details: ocrData }, { status: 500 });
    }
    const text = ocrData?.ParsedResults?.[0]?.ParsedText || '';
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
} 