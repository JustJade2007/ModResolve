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
    const session = await getSession();
    if (session?.user?.email === process.env.ADMIN_EMAIL && session.user.isAdmin) {
      return true;
    }
    const userData = await UserData.getInstance();
    const user = await userData.findUserByEmailOrName(email);
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
}

export async function adminLogin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const identifierMatch = username === adminEmail || username === adminUsername;

  if (identifierMatch && password === adminPassword) {
    const adminUser: DbUser = {
      name: adminUsername!,
      email: adminEmail!,
      password: '', // This is not stored in the cookie
      isAdmin: true,
    };
    await createSession(adminUser);
    return redirect('/admin');
  }

  return redirect('/admin/login?error=Invalid+administrator+credentials');
}

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return redirect('/login?error=Invalid+credentials');
  }

  try {
    const userData = await UserData.getInstance();
    const user = await userData.findUserByEmailOrName(username);
    
    if (user && user.password === password) {
      await createSession(user);
      return redirect('/');
    }
  } catch (error) {
    console.error("Login failed:", error);
    return redirect('/login?error=An+unexpected+error+occurred');
  }
  
  // If all checks fail, redirect with an error.
  return redirect('/login?error=Invalid+credentials');
}


export async function logout() {
  cookies().delete('session');
  redirect('/');
}
