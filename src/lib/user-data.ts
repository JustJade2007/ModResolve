
import * as fs from 'fs/promises';
import path from 'path';
import type { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'private');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

// This class is a singleton to ensure only one instance manages the database files.
export class UserData {
  private static instance: UserData;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.initializationPromise = this.initialize().catch(err => {
      console.error("Failed to initialize UserData singleton", err);
      this.initializationPromise = null; // Reset for retry
      throw err;
    });
  }

  public static getInstance(): UserData {
    if (!UserData.instance) {
      UserData.instance = new UserData();
    }
    return UserData.instance;
  }

  private async initialize(): Promise<void> {
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
      
      // Ensure admin user exists on every startup
      await this.ensureAdminUser();

    } catch (error) {
      console.error('CRITICAL: Failed to initialize UserData store.', error);
      throw error;
    }
  }
  
  private async ensureAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminUsername || !adminPassword) {
      console.warn("Admin credentials not found in .env file. Skipping admin user creation.");
      return;
    }

    const users = await this.readUsersFile();
    const adminExists = users.some(u => u.email === adminEmail);

    if (!adminExists) {
        users.push({
            name: adminUsername,
            email: adminEmail,
            password: adminPassword,
            isAdmin: true,
        });
        await this.writeUsersFile(users);
    }
  }
  
  private async readUsersFile(): Promise<User[]> {
    await this.initializationPromise;
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8');
      return JSON.parse(usersData);
    } catch(e) {
      console.error("Could not read users file, returning empty array.", e);
      return [];
    }
  }

  private async writeUsersFile(users: User[]): Promise<void> {
    await this.initializationPromise;
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
  }

  private async readRequestsFile(): Promise<AccountRequest[]> {
    await this.initializationPromise;
     try {
      const requestsData = await fs.readFile(requestsPath, 'utf-8');
      return JSON.parse(requestsData);
    } catch(e) {
      console.error("Could not read requests file, returning empty array.", e);
      return [];
    }
  }

  private async writeRequestsFile(requests: AccountRequest[]): Promise<void> {
    await this.initializationPromise;
    await fs.writeFile(requestsPath, JSON.stringify(requests, null, 2), 'utf-8');
  }

  // PUBLIC API for user data
  async getUsers(): Promise<User[]> {
    return this.readUsersFile();
  }
  
  async getRequests(): Promise<AccountRequest[]> {
    return this.readRequestsFile();
  }

  async findUserByEmailOrName(identifier: string): Promise<User | undefined> {
    const users = await this.readUsersFile();
    return users.find(user => user.email === identifier || user.name === identifier);
  }
  
  async findRequestByEmailOrName(identifier: string): Promise<AccountRequest | undefined> {
    const requests = await this.readRequestsFile();
    return requests.find(req => req.email === identifier || req.name === identifier);
  }
  
  async findRequestByEmail(email: string): Promise<AccountRequest | undefined> {
    const requests = await this.readRequestsFile();
    return requests.find(req => req.email === email);
  }

  async addUser(user: Omit<User, 'isAdmin'>, isAdmin = false): Promise<void> {
    const users = await this.readUsersFile();
    const emailExists = users.some(u => u.email === user.email);
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }
    const nameExists = users.some(u => u.name === user.name);
    if (nameExists) {
      throw new Error('User with this username already exists.');
    }
    users.push({ ...user, isAdmin });
    await this.writeUsersFile(users);
  }
  
  async addRequest(request: AccountRequest): Promise<void> {
    const requests = await this.readRequestsFile();
    requests.push(request);
    await this.writeRequestsFile(requests);
  }

  async deleteUser(email: string): Promise<void> {
    let users = await this.readUsersFile();
    users = users.filter(user => user.email !== email);
    await this.writeUsersFile(users);
  }
  
  async approveRequestByEmail(email: string): Promise<void> {
    const request = await this.findRequestByEmail(email);
    if (!request) {
        throw new Error("Request not found");
    }
    
    const users = await this.readUsersFile();
    const userExists = users.some(u => u.email === request.email);
    if (!userExists) {
      users.push({ ...request, isAdmin: false });
      await this.writeUsersFile(users);
    }
    
    // Whether user existed or not, remove the request
    await this.denyRequest(request.email);
  }

  async denyRequest(email: string): Promise<void> {
    let requests = await this.readRequestsFile();
    requests = requests.filter(req => req.email !== email);
    await this.writeRequestsFile(requests);
  }
}
