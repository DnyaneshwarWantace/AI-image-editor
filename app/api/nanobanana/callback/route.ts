import { NextResponse } from 'next/server';

// Nano Banana requires a callback URL. We don't need to persist anything yet.
export async function POST() {
  return NextResponse.json({ ok: true });
}

