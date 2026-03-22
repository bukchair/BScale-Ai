import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { prisma } from '@/src/lib/db/prisma';
import { Prisma } from '@prisma/client';

// GET /api/user/connections — returns saved connection items for the current user
export async function GET() {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let dbUser;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { settings: true },
    });
  } catch (err) {
    console.error('[/api/user/connections GET] DB error:', err);
    return NextResponse.json({ error: 'Database error', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }

  const settings = (dbUser?.settings ?? {}) as Record<string, unknown>;
  const connections = (settings.connections as unknown[]) ?? [];

  return NextResponse.json({ connections });
}

// PATCH /api/user/connections — saves connection items
export async function PATCH(request: Request) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { connections?: unknown[] };
  try {
    body = (await request.json()) as { connections?: unknown[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.connections)) {
    return NextResponse.json({ error: 'connections must be an array' }, { status: 400 });
  }

  let dbUser2;
  try {
    dbUser2 = await prisma.user.findUnique({
      where: { id: user.id },
      select: { settings: true },
    });
  } catch (err) {
    console.error('[/api/user/connections PATCH] DB findUnique error:', err);
    return NextResponse.json({ error: 'Database error', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }

  const currentSettings = (dbUser2?.settings ?? {}) as Record<string, unknown>;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { settings: { ...currentSettings, connections: body.connections } as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error('[/api/user/connections PATCH] DB update error:', err);
    return NextResponse.json({ error: 'Database error', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
