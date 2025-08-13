
import * as fs from 'fs/promises';
import path from 'path';
import type { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'private');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

const initialUsers: User[] = [
  {
    "name": "Admin",
    "email": "JustJade2007",
    "password": "Chuck62",
    "isAdmin": true
  },
  {
    "name": "Admin",
    "email": "jacobhite2007@gmail.com",
    "password": "Chuck62",
    "isAdmin": true
  }
];

const initialRequests: AccountRequest[] = [
  {
    "name": "Test Mctestington",
    "email": "enderboii266@gmail.com",
    "password": "test123"
  }
];


// --- Initialization and Utility Functions ---

async function ensureFile(filePath: string, defaultContent: any[]): Promise<void> {
    try {
        await fs.access(filePath);
        // File exists, check if it's empty
        const stat = await fs.stat(filePath);
        if (stat.size === 0) {
             await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
        }
    } catch {
        // File doesn't exist, create it with default content
        await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
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
        throw error; // Propagate error to stop the process if data store is broken
    }
}

async function ensureAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminUsername || !adminPassword) {
      console.warn("Admin credentials not found in .env file. Skipping admin user creation.");
      return;
    }

    const users = await readUsersFile();
    const adminExists = users.some(u => u.email === adminEmail);

    if (!adminExists) {
        users.push({
            name: adminUsername,
            email: adminEmail,
            password: adminPassword,
            isAdmin: true,
        });
        await writeUsersFile(users);
    }
}

// --- Core Read/Write Operations ---

async function readUsersFile(): Promise<User[]> {
    const usersData = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(usersData);
}

async function writeUsersFile(users: User[]): Promise<void> {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

async function readRequestsFile(): Promise<AccountRequest[]> {
    const requestsData = await fs.readFile(requestsPath, 'utf-8');
    return JSON.parse(requestsData);
}

async function writeRequestsFile(requests: AccountRequest[]): Promise<void> {
    await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
}

// Initialize on first import.
initializeDataStore().catch(err => {
  console.error("Failed to initialize data store on startup:", err);
  process.exit(1);
});


// --- Public Data Access API ---

export async function getUsers(): Promise<User[]> {
  return await readUsersFile();
}

export async function getRequests(): Promise<AccountRequest[]> {
  return await readRequestsFile();
}

export async function findUserByEmailOrName(identifier: string): Promise<User | undefined> {
  const users = await readUsersFile();
  return users.find(user => user.email === identifier || user.name === identifier);
}

export async function findRequestByEmailOrName(identifier: string): Promise<AccountRequest | undefined> {
    const requests = await readRequestsFile();
    return requests.find(req => req.email === identifier || req.name === identifier);
}

export async function findRequestByEmail(email: string): Promise<AccountRequest | undefined> {
    const requests = await readRequestsFile();
    return requests.find(req => req.email === email);
}

export async function addUser(user: Omit<User, 'isAdmin'>, isAdmin = false): Promise<void> {
    const users = await readUsersFile();
    const emailExists = users.some(u => u.email === user.email);
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }
    const nameExists = users.some(u => u.name === user.name);
    if (nameExists) {
      throw new Error('User with this username already exists.');
    }
    users.push({ ...user, isAdmin });
    await writeUsersFile(users);
}

export async function addRequest(request: AccountRequest): Promise<void> {
    const requests = await readRequestsFile();
    const userExists = await findUserByEmailOrName(request.email) || await findUserByEmailOrName(request.name);
    if(userExists) {
      throw new Error('An account with this email or username already exists.');
    }

    const requestEmailExists = requests.some(r => r.email === request.email);
    if(requestEmailExists) {
        throw new Error('An account with this email has already been requested.');
    }
    const requestNameExists = requests.some(r => r.name === request.name);
    if(requestNameExists) {
        throw new Error('An account with this username has already been requested.');
    }
    requests.push(request);
    await writeRequestsFile(requests);
}

export async function deleteUser(email: string): Promise<void> {
    let users = await readUsersFile();
    users = users.filter(user => user.email !== email);
    await writeUsersFile(users);
}

export async function approveRequestByEmail(email: string): Promise<void> {
    const requests = await readRequestsFile();
    const request = requests.find(req => req.email === email);
    if (!request) {
        throw new Error("Request not found");
    }
    
    // Use the core addUser function to handle duplicate checks etc.
    await addUser({ name: request.name, email: request.email, password: request.password }, false);
    
    // Whether user creation succeeded or not, remove the request
    await denyRequest(request.email);
}

export async function denyRequest(email: string): Promise<void> {
    let requests = await readRequestsFile();
    requests = requests.filter(req => req.email !== email);
    await writeRequestsFile(requests);
}
