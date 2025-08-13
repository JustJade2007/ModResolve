import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { getAccountRequests, getUsers } from '@/lib/actions';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session || !(await isAdmin(session.user.email))) {
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
