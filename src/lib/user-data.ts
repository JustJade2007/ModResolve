import * as fs from 'fs/promises';
import path from 'path';
import type { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

type Db = {
  users: User[];
  requests: AccountRequest[];
};

// This class is a singleton to ensure only one instance manages the database files.
export class UserData {
  private static instance: UserData;
  private db: Db = { users: [], requests: [] };
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;


  private constructor() {}

  public static getInstance(): Promise<UserData> {
    if (!UserData.instance) {
      UserData.instance = new UserData();
      UserData.instance.initializationPromise = UserData.instance.initialize().catch(err => {
        console.error("Failed to initialize UserData singleton", err);
        // Reset instance on failure so we can retry.
        UserData.instance.isInitialized = false; 
        UserData.instance.initializationPromise = null;
        throw err; // re-throw error
      });
    }
    return UserData.instance.initializationPromise!.then(() => UserData.instance);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await fs.mkdir(dataDir, { recursive: true });

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      // Load users or create the file with an admin if it doesn't exist
      if (await this.fileExists(usersPath)) {
        const usersData = await fs.readFile(usersPath, 'utf-8');
        this.db.users = usersData ? JSON.parse(usersData) : [];
      } else if (adminEmail && adminPassword && adminUsername) {
        // If users.json doesn't exist, create it with the admin user
        this.db.users.push({
          name: adminUsername,
          email: adminEmail,
          password: adminPassword,
          isAdmin: true,
        });
        await this.writeUsers();
      }
      
      // Load requests or create the file if it doesn't exist
      if (await this.fileExists(requestsPath)) {
          const requestsData = await fs.readFile(requestsPath, 'utf-8');
          this.db.requests = requestsData ? JSON.parse(requestsData) : [];
      } else {
          await this.writeRequests();
      }

    } catch (error) {
      console.error('CRITICAL: Failed to initialize UserData store.', error);
      // If there's a catastrophic error, start fresh
      this.db = { users: [], requests: [] };
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword && adminUsername) {
        this.db.users.push({
          name: adminUsername,
          email: adminEmail,
          password: adminPassword,
          isAdmin: true,
        });
      }
      await this.writeAll();
    }
    
    this.isInitialized = true;
  }

  private async writeUsers(): Promise<void> {
    await fs.writeFile(usersPath, JSON.stringify(this.db.users, null, 2), 'utf-8');
  }

  private async writeRequests(): Promise<void> {
    await fs.writeFile(requestsPath, JSON.stringify(this.db.requests, null, 2), 'utf-8');
  }
  
  private async writeAll(): Promise<void> {
    await this.writeUsers();
    await this.writeRequests();
  }

  // PUBLIC API for user data
  getUsers(): User[] {
    return [...this.db.users];
  }
  
  getRequests(): AccountRequest[] {
    return [...this.db.requests];
  }

  async findUserByEmailOrName(identifier: string): Promise<User | undefined> {
    return this.db.users.find(user => user.email === identifier || user.name === identifier);
  }
  
  async findRequestByEmailOrName(identifier: string): Promise<AccountRequest | undefined> {
    return this.db.requests.find(req => req.email === identifier || req.name === identifier);
  }
  
  async findRequestByEmail(email: string): Promise<AccountRequest | undefined> {
    return this.db.requests.find(req => req.email === email);
  }

  async addUser(user: Omit<User, 'isAdmin'>): Promise<void> {
    const emailExists = await this.findUserByEmailOrName(user.email);
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }
    const nameExists = await this.findUserByEmailOrName(user.name);
    if (nameExists) {
      throw new Error('User with this username already exists.');
    }
    this.db.users.push({ ...user, isAdmin: false });
    await this.writeUsers();
  }
  
  async addRequest(request: AccountRequest): Promise<void> {
    this.db.requests.push(request);
    await this.writeRequests();
  }

  async deleteUser(email: string): Promise<void> {
    const initialLength = this.db.users.length;
    this.db.users = this.db.users.filter(user => user.email !== email);
    if(this.db.users.length < initialLength) {
        await this.writeUsers();
    }
  }
  
  async approveRequestByEmail(email: string): Promise<void> {
    const request = await this.findRequestByEmail(email);
    if (!request) {
        throw new Error("Request not found");
    }
    const userExists = await this.findUserByEmailOrName(request.email);
    if (!userExists) {
        await this.addUser(request);
    }
    // Whether user existed or not, remove the request
    await this.denyRequest(request.email);
  }

  async denyRequest(email: string): Promise<void> {
    const initialLength = this.db.requests.length;
    this.db.requests = this.db.requests.filter(req => req.email !== email);
    if(this.db.requests.length < initialLength) {
      await this.writeRequests();
    }
  }
}
