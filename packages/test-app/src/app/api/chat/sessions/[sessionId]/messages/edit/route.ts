import { NextRequest, NextResponse } from 'next/server';
import { getHandlers } from '../../../../handlers';

const TEST_USER_ID = 'test-user-1';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of getHandlers().editMessage(TEST_USER_ID, body)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const errorEvent = `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
