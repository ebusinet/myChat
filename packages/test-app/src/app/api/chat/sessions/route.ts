import { NextRequest, NextResponse } from 'next/server';
import { getHandlers } from '../handlers';

const TEST_USER_ID = 'test-user-1';

export async function GET() {
  const sessions = await getHandlers().listSessions(TEST_USER_ID);
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session = await getHandlers().createSession(TEST_USER_ID, body);
  return NextResponse.json(session);
}
