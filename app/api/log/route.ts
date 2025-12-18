import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    const logFile = path.join(logsDir, 'app.log.txt');
    const logLine = `[${new Date().toISOString()}] ${JSON.stringify(body)}\n`;
    fs.appendFileSync(logFile, logLine);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}

// Optional: handle unsupported methods like GET, PUT, etc.
export async function GET() {
  return NextResponse.json({ error: 'GET method not supported' }, { status: 405 });
}
