import { NextResponse } from 'next/server';

export async function GET() {
  // In a real app, fetch from database
  return NextResponse.json({
    siteTitle: process.env.SITE_TITLE || 'Krushi Radio',
    maxFileSize: process.env.MAX_FILE_SIZE || '300'
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // In a real app, save to database
    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 