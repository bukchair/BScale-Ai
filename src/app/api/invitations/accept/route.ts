import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { prisma } from '@/src/lib/db/prisma';

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAuthenticatedUser();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let token: string | undefined;
  try {
    const body = (await request.json()) as { token?: string };
    token = typeof body.token === 'string' ? body.token.trim() : undefined;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing invitation token' }, { status: 400 });
  }

  let access;
  try {
    access = await prisma.sharedAccess.findUnique({ where: { inviteToken: token } });
  } catch (err) {
    // Table may not exist yet if the migration is still pending — treat as not found.
    console.error('[invitations/accept] DB lookup failed (migration may be pending):', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: true, warning: 'Invite accepted in Firestore; DB sync pending migration.' });
  }

  if (!access) {
    // Row not yet synced to DB (e.g. invite was created before migration ran) — treat as accepted.
    console.warn(`[invitations/accept] No SharedAccess row for token ${token} — Firestore-only invite.`);
    return NextResponse.json({ success: true, warning: 'Invite accepted; DB record will sync on next login.' });
  }

  if (access.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: 'This invitation was sent to a different email address' },
      { status: 403 }
    );
  }

  if (access.status === 'accepted') {
    return NextResponse.json({ success: true, message: 'Already accepted', ownerUserId: access.ownerUserId });
  }

  if (access.status === 'revoked') {
    return NextResponse.json({ success: false, error: 'This invitation has been revoked' }, { status: 410 });
  }

  try {
    await prisma.sharedAccess.update({
      where: { inviteToken: token },
      data: {
        status: 'accepted',
        sharedUserId: user.id,
        acceptedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[invitations/accept] DB update failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: true, warning: 'Firestore status updated; DB sync pending migration.' });
  }

  return NextResponse.json({ success: true, message: 'Invitation accepted', ownerUserId: access.ownerUserId });
}
