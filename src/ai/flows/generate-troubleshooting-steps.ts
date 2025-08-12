'use server';

/**
 * @fileOverview Generates troubleshooting steps based on the analyzed error log.
 *
 * - generateTroubleshootingSteps - A function that generates a step-by-step guide to resolve issues.
 * - GenerateTroubleshootingStepsInput - The input type for the generateTroubleshootingSteps function.
 * - GenerateTroubleshootingStepsOutput - The return type for the generateTroubleshootingSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTroubleshootingStepsInputSchema = z.object({
  analysis: z
    .string()
    .describe("The analysis of the error log, including identified issues."),
  minecraftVersion: z.string().describe('The Minecraft version.'),
  modloader: z.enum(['Forge', 'Fabric', 'Quilt', 'Vanilla', 'NeoForge']).describe('The modloader type (Forge, Fabric, Quilt, Vanilla, NeoForge).'),
});
export type GenerateTroubleshootingStepsInput = z.infer<
  typeof GenerateTroubleshootingStepsInputSchema
>;

const GenerateTroubleshootingStepsOutputSchema = z.object({
  steps: z
    .string()
    .describe(
      'A step-by-step guide to resolve the identified issues, including links to download missing dependencies from trusted sources.'
    ),
});
export type GenerateTroubleshootingStepsOutput = z.infer<
  typeof GenerateTroubleshootingStepsOutputSchema
>;

export async function generateTroubleshootingSteps(
  input: GenerateTroubleshootingStepsInput
): Promise<GenerateTroubleshootingStepsOutput> {
  return generateTroubleshootingStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTroubleshootingStepsPrompt',
  input: {schema: GenerateTroubleshootingStepsInputSchema},
  output: {schema: GenerateTroubleshootingStepsOutputSchema},
  prompt: `You are an AI expert in Minecraft troubleshooting. Generate a step-by-step guide to resolve the identified issues based on the error analysis, Minecraft version, and modloader type. Include links to download missing dependencies from trusted sources when available.\n\nError Analysis: {{{analysis}}}\nMinecraft Version: {{{minecraftVersion}}}\nModloader: {{{modloader}}}\n\nTroubleshooting Steps:`, // Ensure proper Handlebars syntax
});

const generateTroubleshootingStepsFlow = ai.defineFlow(
  {
    name: 'generateTroubleshootingStepsFlow',
    inputSchema: GenerateTroubleshootingStepsInputSchema,
    outputSchema: GenerateTroubleshootingStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
