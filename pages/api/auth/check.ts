import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
