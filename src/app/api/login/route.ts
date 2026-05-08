import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: unknown };
  const validPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (typeof password === "string" && password === validPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
