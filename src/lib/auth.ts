'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as fs from 'fs/promises';
import path from 'path';

const SECRET_KEY =
  process.env.AUTH_SECRET || 'a-very-secret-key-that-is-not-secure';

export type User = {
  name: string;
  email: string;
  password?: string; // Should be hashed in a real app
  isAdmin: boolean;
};

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');

async function initializeAdminUser() {
  try {
    await fs.access(usersPath);
  } catch {
    // File doesn't exist, create it with the admin user
    const adminUser: User = {
      name: 'Admin',
      email: process.env.ADMIN_USERNAME || 'jacobhite2007@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'Chuck62$1',
      isAdmin: true,
    };
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(usersPath, JSON.stringify([adminUser], null, 2));
  }
}

// Call initialization on module load
initializeAdminUser();

export async function isAdmin(email: string): Promise<boolean> {
  try {
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const users: User[] = JSON.parse(usersData);
    const user = users.find(u => u.email === email);
    return user ? user.isAdmin : false;
  } catch (error) {
    console.error('Error reading users file in isAdmin:', error);
    return false;
  }
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
    redirect('/login?error=Invalid%20credentials');
    return;
  }

  let users: User[] = [];
  try {
    const usersData = await fs.readFile(usersPath, 'utf-8');
    users = JSON.parse(usersData);
  } catch (error) {
    console.error("Could not read users.json:", error);
    redirect('/login?error=Server%20error');
    return;
  }
  
  const user = users.find(u => u.email === email);

  if (user && user.password === password) {
    // In a real app, use a secure comparison like bcrypt.compare
    await createSession(user);
    redirect('/');
  } else {
    redirect('/login?error=Invalid%20credentials');
  }
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
