'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
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
import { UserData } from './user-data';

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
  name: z.string().min(2, 'Username must be at least 2 characters.'),
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

export type User = z.infer<typeof userSchema> & { isAdmin: boolean };
export type AccountRequest = z.infer<typeof userSchema>;

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
  const userData = await UserData.getInstance();
  
  const userExists = await userData.findUserByEmailOrName(newRequest.email) || await userData.findUserByEmailOrName(newRequest.name);
  const requestExists = await userData.findRequestByEmailOrName(newRequest.email) || await userData.findRequestByEmailOrName(newRequest.name);

  if (userExists || requestExists) {
    return { message: null, error: 'An account with this email or username already exists or has been requested.' };
  }

  try {
    await userData.addRequest(newRequest);
    return { error: null, message: 'Account request submitted successfully.' };
  } catch(e) {
    const error = e instanceof Error ? e.message : 'Failed to submit request.';
    return { message: null, error };
  }
}

export async function createUser(
  prevState: ActionFormState | undefined,
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
  
  try {
    const userData = await UserData.getInstance();
    await userData.addUser({ name, email, password });
    revalidatePath('/admin');
    return { error: null, message: `User ${name} created successfully.` };
  } catch(e) {
      const error = e instanceof Error ? e.message : 'Failed to create user.';
      return { message: null, error };
  }
}

export async function getAccountRequests(): Promise<AccountRequest[]> {
  const userData = await UserData.getInstance();
  return userData.getRequests();
}

export async function getUsers(): Promise<User[]> {
  const userData = await UserData.getInstance();
  return userData.getUsers();
}

export async function approveRequest(
  formData: FormData
): Promise<ActionFormState> {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required.', message: null };
  }

  try {
    const userData = await UserData.getInstance();
    await userData.approveRequestByEmail(email);

    revalidatePath('/admin');
    return { error: null, message: `Approved request for ${email}` };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to approve request.';
    return { error, message: null };
  }
}

export async function denyRequest(
  formData: FormData
): Promise<ActionFormState> {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required.', message: null };
  }
  try {
    const userData = await UserData.getInstance();
    await userData.denyRequest(email);

    revalidatePath('/admin');
    return { error: null, message: `Denied request for ${email}` };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to deny request.';
    return { error, message: null };
  }
}

export async function deleteUser(
  formData: FormData
): Promise<ActionFormState> {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required.', message: null };
  }
  try {
    const userData = await UserData.getInstance();
    const adminEmail = process.env.ADMIN_EMAIL;
    if (email === adminEmail) {
        return { error: 'Cannot delete the primary admin account.', message: null };
    }
    
    await userData.deleteUser(email);

    revalidatePath('/admin');
    return { error: null, message: `User ${email} deleted.` };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Failed to delete user.';
    return { error, message: null };
  }
}
