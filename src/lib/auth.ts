'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserData } from './user-data';
import type { User as DbUser } from './actions';

// We only want to expose a non-sensitive version of the user in the session
export type User = Omit<DbUser, 'password'>;

export async function getSession(): Promise<{ user: User } | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    // In a real app, you would use a library like 'jose' to sign and verify JWTs.
    // For this prototype, we'll use a simple base64 encoded JSON object.
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
    
    // Ensure we don't leak sensitive data, even if it somehow got in the cookie
    const { password, ...userWithoutPassword } = sessionData;
    return { user: userWithoutPassword as User };
  } catch (error) {
    console.error('Session parsing failed:', error);
    return null;
  }
}

export async function isAdmin(email: string): Promise<boolean> {
    const userData = await UserData.getInstance();
    const user = await userData.findUserByEmail(email);
    return user?.isAdmin ?? false;
}

async function createSession(user: DbUser) {
  const { password, ...userToStore } = user;
  const sessionData = Buffer.from(JSON.stringify(userToStore)).toString('base64');
  
  cookies().set('session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });

  // Redirect after setting the cookie
  redirect('/');
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?error=Invalid+credentials');
  }

  try {
    const userData = await UserData.getInstance();
    const user = await userData.findUserByEmail(email);
    
    if (user && user.password === password) {
      // On success, create the session and redirect.
      // The redirect is now handled inside createSession.
      await createSession(user);
    } else {
      // If user not found or password doesn't match, redirect with error.
      return redirect('/login?error=Invalid+credentials');
    }
  } catch (error) {
    console.error("Login failed:", error);
    // If any other error occurs, also redirect with an error.
    return redirect('/login?error=An+unexpected+error+occurred');
  }
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
