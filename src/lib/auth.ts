'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

// In a real app, use a robust library like 'jose' for JWTs and store secrets in .env
const SECRET_KEY =
  process.env.AUTH_SECRET || 'a-very-secret-key-that-is-not-secure';

export type User = {
  username: string;
};

// It's crucial to load credentials from environment variables and not hardcode them.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function getSession(): Promise<{user: User} | null> {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  try {
    // In a real app, you would verify the signature of the JWT here
    const user = JSON.parse(Buffer.from(session, 'base64').toString());
    return {user};
  } catch (error) {
    return null;
  }
}

async function createSession(user: User) {
  // In a real app, you would create a signed JWT
  const sessionData = Buffer.from(JSON.stringify(user)).toString('base64');
  cookies().set('session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });
}

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    // In a real app, handle this error more gracefully
    redirect('/login?error=Invalid%20credentials');
  }

  if (
    ADMIN_USERNAME &&
    ADMIN_PASSWORD &&
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    await createSession({username});
    redirect('/');
  } else {
    // In a real app, handle this error more gracefully
    redirect('/login?error=Invalid%20credentials');
  }
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
