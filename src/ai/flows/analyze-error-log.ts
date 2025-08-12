'use server';

/**
 * @fileOverview Analyzes a Minecraft error log to identify the root cause of issues.
 *
 * - analyzeErrorLog - A function that handles the error log analysis process.
 * - AnalyzeErrorLogInput - The input type for the analyzeErrorLog function.
 * - AnalyzeErrorLogOutput - The return type for the analyzeErrorLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeErrorLogInputSchema = z.object({
  errorLog: z
    .string()
    .describe('The Minecraft error log to analyze.'),
  minecraftVersion: z.string().describe('The Minecraft version the error log is from.'),
  modloader: z
    .enum(['Forge', 'Fabric', 'Quilt', 'Vanilla'])
    .describe('The modloader used, if any.'),
});
export type AnalyzeErrorLogInput = z.infer<typeof AnalyzeErrorLogInputSchema>;

const AnalyzeErrorLogOutputSchema = z.object({
  rootCause: z.string().describe('The root cause of the issue identified in the error log.'),
  potentialSolutions: z.string().describe('Potential solutions to resolve the identified issue.'),
});
export type AnalyzeErrorLogOutput = z.infer<typeof AnalyzeErrorLogOutputSchema>;

export async function analyzeErrorLog(input: AnalyzeErrorLogInput): Promise<AnalyzeErrorLogOutput> {
  return analyzeErrorLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeErrorLogPrompt',
  input: {schema: AnalyzeErrorLogInputSchema},
  output: {schema: AnalyzeErrorLogOutputSchema},
  prompt: `You are a Minecraft expert specializing in analyzing error logs.

You will use the provided error log, Minecraft version, and modloader to identify the root cause of the issue and suggest potential solutions.

Error Log:
{{errorLog}}

Minecraft Version: {{minecraftVersion}}
Modloader: {{modloader}}

Identify the root cause of the issue and suggest potential solutions.
`,
});

const analyzeErrorLogFlow = ai.defineFlow(
  {
    name: 'analyzeErrorLogFlow',
    inputSchema: AnalyzeErrorLogInputSchema,
    outputSchema: AnalyzeErrorLogOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
