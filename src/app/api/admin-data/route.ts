
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRequests, getUsers } from '@/lib/user-data';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [requests, users] = await Promise.all([
      getRequests(),
      getUsers(),
    ]);
    return NextResponse.json({ requests, users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin data';
    console.error("API Error fetching admin data:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
