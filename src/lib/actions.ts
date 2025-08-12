"use server";

import { z } from "zod";
import {
  analyzeErrorLog,
  type AnalyzeErrorLogOutput,
} from "@/ai/flows/analyze-error-log";
import {
  generateTroubleshootingSteps,
  type GenerateTroubleshootingStepsOutput,
} from "@/ai/flows/generate-troubleshooting-steps";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  errorLog: z.string().min(50, "Error log must be at least 50 characters."),
  minecraftVersion: z.string().min(1, "Minecraft version is required."),
  modloader: z.enum(["Forge", "Fabric", "Quilt", "Vanilla"]),
});

export type AnalyzeAndSuggestResult = {
  analysis: AnalyzeErrorLogOutput;
  steps: GenerateTroubleshootingStepsOutput;
};

export interface FormState {
  result: AnalyzeAndSuggestResult | null;
  error: string | null;
}

export async function analyzeAndSuggest(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = formSchema.safeParse({
    errorLog: formData.get("errorLog"),
    minecraftVersion: formData.get("minecraftVersion"),
    modloader: formData.get("modloader"),
  });

  if (!validatedFields.success) {
    return {
      result: null,
      error: validatedFields.error.flatten().fieldErrors.errorLog?.[0] || 'Invalid input.',
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
      error: "An unexpected error occurred while analyzing the log. Please try again.",
    };
  }
}
