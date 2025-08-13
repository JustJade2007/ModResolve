
'use server';
import * as fs from 'fs/promises';
import path from 'path';
import type { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'private');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

const initialUsers: User[] = [
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

const initialRequests: AccountRequest[] = [
  {
    name: 'Test Mctestington',
    email: 'enderboii266@gmail.com',
    password: 'test123',
  },
];

// --- Initialization and Utility Functions ---

async function ensureFile(
  filePath: string,
  defaultContent: any[]
): Promise<void> {
  try {
    await fs.access(filePath);
    // File exists, check if it's empty
    const stat = await fs.stat(filePath);
    if (stat.size === 0) {
      await fs.writeFile(
        filePath,
        JSON.stringify(defaultContent, null, 2),
        'utf-8'
      );
    }
  } catch {
    // File doesn't exist, create it with default content
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify(defaultContent, null, 2),
      'utf-8'
    );
  }
}

async function ensureAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminUsername || !adminPassword) {
    console.warn(
      'Admin credentials not found in .env file. Skipping admin user creation.'
    );
    return;
  }

  const users = await getUsers();
  const adminExists = users.some(u => u.email === adminEmail);

  if (!adminExists) {
    users.push({
      name: adminUsername,
      email: adminEmail,
      password: adminPassword,
      isAdmin: true,
    });
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
  }
}


async function initializeDataStore(): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await ensureFile(usersPath, initialUsers);
        await ensureFile(requestsPath, initialRequests);
        await ensureAdminUser();
    } catch (error) {
        console.error('CRITICAL: Failed to initialize UserData store.', error);
    }
}

// Initialize on first import.
initializeDataStore().catch(err => {
  console.error("Failed to initialize data store on startup:", err);
});


// --- Public Data Access API ---

export async function getUsers(): Promise<User[]> {
  try {
    const usersData = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(usersData);
  } catch (error) {
    console.error("Failed to read users file:", error);
    return [];
  }
}

export async function getRequests(): Promise<AccountRequest[]> {
  try {
    const requestsData = await fs.readFile(requestsPath, 'utf-8');
    return JSON.parse(requestsData);
  } catch (error) {
    console.error("Failed to read requests file:", error);
    return [];
  }
}

export async function findUserByEmailOrName(
  identifier: string
): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(
    user => user.email === identifier || user.name === identifier
  );
}

export async function findRequestByEmailOrName(
  identifier: string
): Promise<AccountRequest | undefined> {
  const requests = await getRequests();
  return requests.find(
    req => req.email === identifier || req.name === identifier
  );
}

export async function findRequestByEmail(
  email: string
): Promise<AccountRequest | undefined> {
  const requests = await getRequests();
  return requests.find(req => req.email === email);
}

export async function addUser(
  user: Omit<User, 'isAdmin'>,
  isAdmin = false
): Promise<void> {
  const users = await getUsers();
  const emailExists = users.some(u => u.email === user.email);
  if (emailExists) {
    throw new Error('User with this email already exists.');
  }
  const nameExists = users.some(u => u.name === user.name);
  if (nameExists) {
    throw new Error('User with this username already exists.');
  }
  users.push({ ...user, isAdmin });
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function addRequest(request: AccountRequest): Promise<void> {
  const requests = await getRequests();
  const userExists =
    (await findUserByEmailOrName(request.email)) ||
    (await findUserByEmailOrName(request.name));
  if (userExists) {
    throw new Error('An account with this email or username already exists.');
  }

  const requestEmailExists = requests.some(r => r.email === request.email);
  if (requestEmailExists) {
    throw new Error('An account with this email has already been requested.');
  }
  const requestNameExists = requests.some(r => r.name === request.name);
  if (requestNameExists) {
    throw new Error('An account with this username has already been requested.');
  }
  requests.push(request);
  await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
}

export async function deleteUser(email: string): Promise<void> {
  let users = await getUsers();
  users = users.filter(user => user.email !== email);
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function approveRequestByEmail(email: string): Promise<void> {
  const requests = await getRequests();
  const request = requests.find(req => req.email === email);
  if (!request) {
    throw new Error('Request not found');
  }

  await addUser(
    { name: request.name, email: request.email, password: request.password },
    false
  );

  await denyRequest(request.email);
}

export async function denyRequest(email: string): Promise<void> {
  let requests = await getRequests();
  requests = requests.filter(req => req.email !== email);
  await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
}
