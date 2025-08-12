'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserData } from './user-data';
import type { User } from './actions';


export async function isAdmin(email: string): Promise<boolean> {
  const userData = await UserData.getInstance();
  const user = await userData.findUserByEmail(email);
  return user ? user.isAdmin : false;
}

export async function getSession(): Promise<{ user: Omit<User, 'password'> } | null> {
  const session = (await cookies().get('session')?.value) ?? null;
  if (!session) return null;
  try {
    // In a real app, you would verify the signature of the JWT here
    const user = JSON.parse(Buffer.from(session, 'base64').toString());
    // Ensure we don't leak the password hash
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error) {
    return null;
  }
}

async function createSession(user: User) {
  const sessionData = Buffer.from(JSON.stringify(user)).toString('base64');
  cookies().set('session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?error=Invalid+credentials');
  }

  const userData = await UserData.getInstance();
  const user = await userData.findUserByEmail(email);

  if (user && user.password === password) {
    await createSession(user);
    return redirect('/');
  } else {
    return redirect('/login?error=Invalid+credentials');
  }
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
