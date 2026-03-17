import { NextRequest, NextResponse } from 'next/server';
import { getPublicConfig, updateConfig, resetConfig } from '@/lib/config-store';

export async function GET() {
  return NextResponse.json(getPublicConfig());
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updateConfig(body);
    // Return masked version
    const pub = getPublicConfig();
    return NextResponse.json(pub);
  } catch {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
  }
}

export async function DELETE() {
  resetConfig();
  return NextResponse.json(getPublicConfig());
}
