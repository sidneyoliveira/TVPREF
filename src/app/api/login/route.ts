import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === validPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
