'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as fs from 'fs/promises';
import path from 'path';
import {
  analyzeErrorLog,
  type AnalyzeErrorLogOutput,
} from '@/ai/flows/analyze-error-log';
import {
  generateTroubleshootingSteps,
  type GenerateTroubleshootingStepsOutput,
} from '@/ai/flows/generate-troubleshooting-steps';
import {
  generalHelpFlow,
  type GeneralHelpOutput,
} from '@/ai/flows/general-help';
import { User } from './auth';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'users.json');
const requestsPath = path.join(dataDir, 'requests.json');

// Schemas
const analyzeSchema = z.object({
  errorLog: z.string().min(50, 'Error log must be at least 50 characters.'),
  minecraftVersion: z.string().min(1, 'Minecraft version is required.'),
  modloader: z.enum(['Forge', 'Fabric', 'Quilt', 'Vanilla', 'NeoForge']),
});

const helpSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters.'),
});

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

// Types
export type AnalyzeAndSuggestResult = {
  analysis: AnalyzeErrorLogOutput;
  steps: GenerateTroubleshootingStepsOutput;
};

export interface FormState {
  result: AnalyzeAndSuggestResult | null;
  error: string | null;
}

export interface GeneralHelpFormState {
  result: GeneralHelpOutput | null;
  error: string | null;
}

export interface ActionFormState {
  message: string | null;
  error: string | null;
}

export type AccountRequest = z.infer<typeof userSchema>;

// Helper functions to read/write JSON files
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// AI Actions
export async function analyzeAndSuggest(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = analyzeSchema.safeParse({
    errorLog: formData.get('errorLog'),
    minecraftVersion: formData.get('minecraftVersion'),
    modloader: formData.get('modloader'),
  });

  if (!validatedFields.success) {
    const firstError = Object.values(
      validatedFields.error.flatten().fieldErrors
    )[0]?.[0];
    return {
      result: null,
      error: firstError || 'Invalid input.',
    };
  }

  const { errorLog, minecraftVersion, modloader } = validatedFields.data;

  try {
    const analysis = await analyzeErrorLog({
      errorLog,
      minecraftVersion,
      modloader,
    });

    const steps = await generateTroubleshootingSteps({
      analysis: `${analysis.rootCause}\n${analysis.potentialSolutions}`,
      minecraftVersion,
      modloader,
    });

    return {
      result: { analysis, steps },
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      result: null,
      error:
        'An unexpected error occurred while analyzing the log. Please try again.',
    };
  }
}

export async function generalHelp(
  prevState: GeneralHelpFormState,
  formData: FormData
): Promise<GeneralHelpFormState> {
  const validatedFields = helpSchema.safeParse({
    question: formData.get('question'),
  });

  if (!validatedFields.success) {
    return {
      result: null,
      error:
        validatedFields.error.flatten().fieldErrors.question?.[0] ||
        'Invalid input.',
    };
  }

  const { question } = validatedFields.data;

  try {
    const result = await generalHelpFlow({ question });
    return {
      result,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      result: null,
      error:
        'An unexpected error occurred while processing your question. Please try again.',
    };
  }
}

// User management actions
export async function requestAccount(
  prevState: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  const validatedFields = userSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: null,
      error:
        Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid data.',
    };
  }

  const newRequest = validatedFields.data;
  const requests = await readJsonFile<AccountRequest>(requestsPath);
  const users = await readJsonFile<User>(usersPath);

  if (
    requests.some(r => r.email === newRequest.email) ||
    users.some(u => u.email === newRequest.email)
  ) {
    return { message: null, error: 'An account with this email already exists or has been requested.' };
  }

  requests.push(newRequest);
  await writeJsonFile(requestsPath, requests);

  return { error: null, message: 'Account request submitted successfully.' };
}

export async function createUser(
  prevState: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  const validatedFields = userSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: null,
      error:
        Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] ||
        'Invalid data.',
    };
  }
  
  const { name, email, password } = validatedFields.data;

  const users = await readJsonFile<User>(usersPath);
  if (users.some(u => u.email === email)) {
    return { message: null, error: 'User with this email already exists.' };
  }

  // In a real app, you would hash the password here.
  users.push({ name, email, password, isAdmin: false });
  await writeJsonFile(usersPath, users);
  
  revalidatePath('/admin/requests');

  return { error: null, message: `User ${name} created successfully.` };
}


export async function getAccountRequests(): Promise<AccountRequest[]> {
  return await readJsonFile<AccountRequest>(requestsPath);
}

export async function approveRequest(request: AccountRequest) {
  const users = await readJsonFile<User>(usersPath);
  if (!users.some(u => u.email === request.email)) {
    users.push({ ...request, isAdmin: false });
    await writeJsonFile(usersPath, users);
  }

  let requests = await readJsonFile<AccountRequest>(requestsPath);
  requests = requests.filter(r => r.email !== request.email);
  await writeJsonFile(requestsPath, requests);

  revalidatePath('/admin/requests');
}

export async function denyRequest(email: string) {
  let requests = await readJsonFile<AccountRequest>(requestsPath);
  requests = requests.filter(r => r.email !== email);
  await writeJsonFile(requestsPath, requests);

  revalidatePath('/admin/requests');
}
