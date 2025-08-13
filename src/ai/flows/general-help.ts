'use server';

/**
 * @fileOverview Provides general help for Minecraft issues.
 *
 * - generalHelp - A function that provides solutions for general Minecraft questions.
 * - GeneralHelpInput - The input type for the generalHelp function.
 * - GeneralHelpOutput - The return type for the generalHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralHelpInputSchema = z.object({
  question: z.string().describe('The user\'s question about a Minecraft issue or desired change.'),
});
export type GeneralHelpInput = z.infer<typeof GeneralHelpInputSchema>;

const GeneralHelpOutputSchema = z.object({
  answer: z.string().describe('A detailed, step-by-step solution to the user\'s question.'),
});
export type GeneralHelpOutput = z.infer<typeof GeneralHelpOutputSchema>;

export async function generalHelp(input: GeneralHelpInput): Promise<GeneralHelpOutput> {
  return generalHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generalHelpPrompt',
  input: {schema: GeneralHelpInputSchema},
  output: {schema: GeneralHelpOutputSchema},
  prompt: `You are an AI expert in Minecraft. A user has a general question about fixing an issue or making a change. Provide a clear, step-by-step solution.

User's Question:
{{{question}}}

Provide your answer:
`,
});

const generalHelpFlow = ai.defineFlow(
  {
    name: 'generalHelpFlow',
    inputSchema: GeneralHelpInputSchema,
    outputSchema: GeneralHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
