
import * as fs from 'fs/promises';
import path from 'path';
import { User, AccountRequest } from './actions';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

type Db = {
  users: User[];
  requests: AccountRequest[];
};

export class UserData {
  private static instance: UserData;
  private db: Db = { users: [], requests: [] };
  private initialized = false;

  private constructor() {}

  public static async getInstance(): Promise<UserData> {
    if (!UserData.instance) {
      UserData.instance = new UserData();
      await UserData.instance.initialize();
    }
    return UserData.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      const usersExist = await this.fileExists(usersPath);
      const requestsExist = await this.fileExists(requestsPath);

      if (usersExist) {
        const usersData = await fs.readFile(usersPath, 'utf-8');
        this.db.users = JSON.parse(usersData);
      }
      
      if (requestsExist) {
        const requestsData = await fs.readFile(requestsPath, 'utf-8');
        this.db.requests = JSON.parse(requestsData);
      }

      // Ensure admin user exists if user file was initially empty or didn't exist
      const adminExists = this.db.users.some(
        u => u.email === process.env.ADMIN_USERNAME
      );

      if (!adminExists && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        this.db.users.push({
          name: 'Admin',
          email: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
          isAdmin: true,
        });
        await this.writeUsers();
      }
      
      this.initialized = true;

    } catch (error) {
      console.error('Failed to initialize UserData:', error);
      // In case of parsing error or other issues, start with a clean slate
      this.db = { users: [], requests: [] };
      if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
         this.db.users.push({
          name: 'Admin',
          email: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
          isAdmin: true,
        });
      }
      await this.writeAll();
    }
  }
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async writeUsers(): Promise<void> {
    await fs.writeFile(usersPath, JSON.stringify(this.db.users, null, 2));
  }

  private async writeRequests(): Promise<void> {
    await fs.writeFile(requestsPath, JSON.stringify(this.db.requests, null, 2));
  }

  private async writeAll(): Promise<void> {
      await this.writeUsers();
      await this.writeRequests();
  }

  getUsers(): User[] {
    return this.db.users;
  }
  
  getRequests(): AccountRequest[] {
      return this.db.requests;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.db.users.find(user => user.email === email);
  }
  
  async findRequestByEmail(email: string): Promise<AccountRequest | undefined> {
    return this.db.requests.find(req => req.email === email);
  }

  async addUser(user: User): Promise<void> {
    const exists = await this.findUserByEmail(user.email);
    if (exists) {
      throw new Error('User with this email already exists.');
    }
    this.db.users.push(user);
    await this.writeUsers();
  }
  
  async addRequest(request: AccountRequest): Promise<void> {
    this.db.requests.push(request);
    await this.writeRequests();
  }

  async deleteUser(email: string): Promise<void> {
    this.db.users = this.db.users.filter(user => user.email !== email);
    await this.writeUsers();
  }
  
  async approveRequest(approvedRequest: AccountRequest): Promise<void> {
      const userExists = await this.findUserByEmail(approvedRequest.email);
      if(!userExists) {
        await this.addUser({ ...approvedRequest, isAdmin: false });
      }
      await this.denyRequest(approvedRequest.email); // remove from requests
  }

  async denyRequest(email: string): Promise<void> {
      this.db.requests = this.db.requests.filter(req => req.email !== email);
      await this.writeRequests();
  }
}
