
'use server';

import { z } from 'zod';
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

// Schemas
const analyzeSchema = z.object({
  errorLog: z.string().min(50, 'Error log must be at least 50 characters.'),
  minecraftVersion: z.string().min(1, 'Minecraft version is required.'),
  modloader: z.enum(['Forge', 'Fabric', 'Quilt', 'Vanilla', 'NeoForge']),
});

const helpSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters.'),
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
