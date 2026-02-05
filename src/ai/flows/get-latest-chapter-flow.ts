'use server';
/**
 * @fileOverview A flow to get the latest chapter of a manga using web search.
 *
 * - getLatestChapter - A function that handles finding the latest chapter.
 * - GetLatestChapterOutput - The return type for the getLatestChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetLatestChapterInputSchema = z.object({
  title: z.string().describe('The title of the manga to search for.'),
});

const GetLatestChapterOutputSchema = z.object({
  latestChapter: z
    .number()
    .nullish()
    .describe('The latest chapter number found.'),
  totalChapters: z
    .number()
    .nullish()
    .describe(
      'The total number of chapters if the series is complete. Null if ongoing.'
    ),
});
export type GetLatestChapterOutput = z.infer<
  typeof GetLatestChapterOutputSchema
>;

const getLatestChapterPrompt = ai.definePrompt({
  name: 'getLatestChapterPrompt',
  input: {schema: GetLatestChapterInputSchema},
  output: {schema: GetLatestChapterOutputSchema},
  prompt: `You are an expert manga database. Your task is to find the most recent chapter number for the given manga title.

Manga Title: {{{title}}}

Use your knowledge and search capabilities to find the latest chapter number.
If the series is completed, also provide the total number of chapters.
If it's ongoing or you can't find the total, leave totalChapters as null.
Only provide numerical data.`,
});

const getLatestChapterFlow = ai.defineFlow(
  {
    name: 'getLatestChapterFlow',
    inputSchema: GetLatestChapterInputSchema,
    outputSchema: GetLatestChapterOutputSchema,
  },
  async input => {
    const {output} = await getLatestChapterPrompt(input);
    return output!;
  }
);

export async function getLatestChapter(
  title: string
): Promise<GetLatestChapterOutput> {
  return getLatestChapterFlow({title});
}
