import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAccountRequests, getUsers } from '@/lib/actions';

export async function GET(request: Request) {
  const session = await getSession();
  // Rely on the session's isAdmin flag, which is set at login.
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [requests, users] = await Promise.all([
      getAccountRequests(),
      getUsers(),
    ]);
    return NextResponse.json({ requests, users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin data';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
