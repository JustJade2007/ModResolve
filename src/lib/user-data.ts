
'use server';

import type { User, AccountRequest } from './actions';

// In-memory data store for simplicity and stability in a serverless environment.
// This replaces the unreliable file-based system.

let users: User[] = [
  {
    name: 'Admin',
    email: 'JustJade2007',
    password: 'Chuck62',
    isAdmin: true,
  },
  {
    name: 'Admin',
    email: 'jacobhite2007@gmail.com',
    password: 'Chuck62',
    isAdmin: true,
  },
];

let requests: AccountRequest[] = [
  {
    name: 'Test McTestington',
    email: 'enderboii266@gmail.com',
    password: 'test123',
  },
];

// --- Public Data Access API ---

export async function getUsers(): Promise<User[]> {
  // Return a copy to prevent direct mutation
  return [...users];
}

export async function getRequests(): Promise<AccountRequest[]> {
  // Return a copy to prevent direct mutation
  return [...requests];
}

export async function findUserByEmailOrName(
  identifier: string
): Promise<User | undefined> {
  return users.find(
    user => user.email === identifier || user.name === identifier
  );
}

export async function findRequestByEmailOrName(
  identifier: string
): Promise<AccountRequest | undefined> {
  return requests.find(
    req => req.email === identifier || req.name === identifier
  );
}

export async function addUser(
  user: Omit<User, 'isAdmin'>,
  isAdmin = false
): Promise<void> {
  const emailExists = users.some(u => u.email === user.email);
  if (emailExists) {
    throw new Error('User with this email already exists.');
  }
  const nameExists = users.some(u => u.name === user.name);
  if (nameExists) {
    throw new Error('User with this username already exists.');
  }
  users.push({ ...user, isAdmin });
}

export async function addRequest(request: AccountRequest): Promise<void> {
  const userExists = users.some(u => u.email === request.email || u.name === request.name);
  if (userExists) {
    throw new Error('An account with this email or username already exists.');
  }

  const requestExists = requests.some(r => r.email === request.email || r.name === request.name);
  if (requestExists) {
    throw new Error('An account with this email or username has already been requested.');
  }
  
  requests.push(request);
}

export async function deleteUser(email: string): Promise<void> {
  users = users.filter(user => user.email !== email);
}

export async function approveRequestByEmail(email: string): Promise<void> {
  const request = requests.find(req => req.email === email);
  if (!request) {
    throw new Error('Request not found');
  }

  await addUser(
    { name: request.name, email: request.email, password: request.password },
    false
  );

  // Remove the request after it has been approved
  requests = requests.filter(req => req.email !== email);
}

export async function denyRequest(email: string): Promise<void> {
  requests = requests.filter(req => req.email !== email);
}
