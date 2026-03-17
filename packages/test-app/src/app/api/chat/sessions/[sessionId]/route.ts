import { NextRequest, NextResponse } from 'next/server';
import { getHandlers } from '../../handlers';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  await getHandlers().deleteSession(sessionId);
  return NextResponse.json({ ok: true });
}
