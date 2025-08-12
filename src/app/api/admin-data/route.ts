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
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
