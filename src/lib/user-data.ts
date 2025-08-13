
import * as fs from 'fs/promises';
import path from 'path';
import type { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'private');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

async function initialize() {
    try {
        await fs.mkdir(dataDir, { recursive: true });

        const filesToEnsure = [
            { path: usersPath, default: [] },
            { path: requestsPath, default: [] },
        ];

        for (const file of filesToEnsure) {
            try {
                await fs.access(file.path);
            } catch {
                await fs.writeFile(file.path, JSON.stringify(file.default, null, 2), 'utf-8');
            }
        }
        await ensureAdminUser();
    } catch (error) {
        console.error('CRITICAL: Failed to initialize UserData store.', error);
        throw error;
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


async function readUsersFile(): Promise<User[]> {
    try {
        const usersData = await fs.readFile(usersPath, 'utf-8');
        return JSON.parse(usersData);
    } catch(e) {
        // If file doesn't exist or is invalid, initialize and return empty
        await initialize();
        return [];
    }
}

async function writeUsersFile(users: User[]): Promise<void> {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

async function readRequestsFile(): Promise<AccountRequest[]> {
    try {
        const requestsData = await fs.readFile(requestsPath, 'utf-8');
        return JSON.parse(requestsData);
    } catch(e) {
        // If file doesn't exist or is invalid, initialize and return empty
        await initialize();
        return [];
    }
}

async function writeRequestsFile(requests: AccountRequest[]): Promise<void> {
    await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
}

// Initialize on first import.
initialize().catch(err => {
  console.error("Failed to initialize data store on startup:", err);
  process.exit(1);
});

// PUBLIC API
export async function getUsers(): Promise<User[]> {
  return readUsersFile();
}

export async function getRequests(): Promise<AccountRequest[]> {
  return readRequestsFile();
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
    
    await addUser(request, false);
    
    // Whether user existed or not, remove the request
    await denyRequest(request.email);
}

export async function denyRequest(email: string): Promise<void> {
    let requests = await readRequestsFile();
    requests = requests.filter(req => req.email !== email);
    await writeRequestsFile(requests);
}
