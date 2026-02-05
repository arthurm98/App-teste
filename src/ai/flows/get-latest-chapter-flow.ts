'use server';
/**
 * @fileOverview A flow to get the latest chapter of a manga using web search powered by an LLM.
 *
 * - getLatestChapterAI - A function that finds the latest chapter number for a given manga title.
 * - GetLatestChapterInput - The input type for the flow.
 * - GetLatestChapterOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GetLatestChapterInputSchema = z.object({
  title: z.string().describe('The title of the manga to search for.'),
});
export type GetLatestChapterInput = z.infer<typeof GetLatestChapterInputSchema>;

export const GetLatestChapterOutputSchema = z.object({
  latestChapter: z.number().optional().describe('The latest chapter number found.'),
  source: z.string().optional().describe('The URL of the source where the information was found.'),
  reasoning: z.string().describe('An explanation of how the chapter number was determined and from where.'),
});
export type GetLatestChapterOutput = z.infer<typeof GetLatestChapterOutputSchema>;


const prompt = ai.definePrompt({
    name: 'getLatestChapterPrompt',
    input: {schema: GetLatestChapterInputSchema},
    output: {schema: GetLatestChapterOutputSchema},
    prompt: `You are a manga database expert. Your task is to find the most recent chapter number for a given manga, manhwa, or webtoon.

    Manga Title: {{{title}}}

    Search the web for reliable sources such as official publisher websites (e.g., Shonen Jump), manga database sites (e.g., MyAnimeList, AniList, MangaUpdates), or official reading platforms (e.g., Webtoon, Tapas).

    Prioritize sources that are directly related to the manga itself. Provide the latest chapter number available.

    If you find the information, provide the source URL. Explain your reasoning for choosing that number and source.

    If you cannot find a definitive chapter number, do not guess. Leave the latestChapter field empty and explain why in the reasoning field.
    `,
});

const getLatestChapterFlow = ai.defineFlow(
  {
    name: 'getLatestChapterFlow',
    inputSchema: GetLatestChapterInputSchema,
    outputSchema: GetLatestChapterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function getLatestChapterAI(
  input: GetLatestChapterInput
): Promise<GetLatestChapterOutput> {
  return getLatestChapterFlow(input);
}
