
'use server';
/**
 * @fileOverview An AI flow to find the latest chapter of a manga.
 *
 * - getLatestChapter - A function that finds the latest chapter information.
 * - LatestChapterOutput - The return type for the getLatestChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const LatestChapterOutputSchema = z.object({
  found: z.boolean().describe('Whether a definitive latest chapter was found.'),
  latestChapter: z.number().optional().describe('The latest chapter number found.'),
  mangaTitle: z.string().describe('The title of the manga being checked.'),
});

export type LatestChapterOutput = z.infer<typeof LatestChapterOutputSchema>;

export async function getLatestChapter(title: string): Promise<LatestChapterOutput> {
  return getLatestChapterFlow(title);
}

const prompt = ai.definePrompt({
  name: 'getLatestChapterPrompt',
  input: {schema: z.string()},
  output: {schema: LatestChapterOutputSchema},
  prompt: `You are an expert web researcher specializing in manga, manhwa, and webtoons. 
Your task is to find the most recent chapter number for the given title.
Search the web to find the latest released chapter for the title: {{{input}}}.
If you find a reliable source stating the latest chapter, set "found" to true and provide the chapter number in "latestChapter".
If you cannot find a clear, reliable chapter number, set "found" to false.
The manga title is "{{{input}}}".`,
});

const getLatestChapterFlow = ai.defineFlow(
  {
    name: 'getLatestChapterFlow',
    inputSchema: z.string(),
    outputSchema: LatestChapterOutputSchema,
  },
  async (title) => {
    const {output} = await prompt(title);
    return output!;
  }
);
