import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  isAdminRequest,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/admin-auth";

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: unknown };

  if (isValidAdminPassword(password)) {
    const response = NextResponse.json({ success: true, authenticated: true });
    setAdminSessionCookie(response);
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
