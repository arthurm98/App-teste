
'use server';
/**
 * @fileOverview A flow to get the latest chapter of a manga using web search.
 *
 * - getLatestChapter - A function that handles the chapter lookup process.
 * - GetLatestChapterInput - The input type for the getLatestChapter function.
 * - GetLatestChapterOutput - The return type for the getLatestChapter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// import { webSearch } from 'braintrust';

const GetLatestChapterInputSchema = z.object({
  mangaTitle: z.string().describe('The title of the manga to search for.'),
});
export type GetLatestChapterInput = z.infer<typeof GetLatestChapterInputSchema>;

const GetLatestChapterOutputSchema = z.object({
  latestChapter: z.number().nullable().describe('The latest chapter number found, or null if not found.'),
});
export type GetLatestChapterOutput = z.infer<typeof GetLatestChapterOutputSchema>;


// const searchTool = ai.defineTool(
//     {
//         name: 'webSearch',
//         description: 'Searches the web for a given query and returns the top results.',
//         input: { schema: z.object({ query: z.string() }) },
//         output: { schema: z.any() },
//     },
//     async ({ query }) => {
//         const searchResults = await webSearch(query, {
//             // This is a free endpoint, but has very low rate limits.
//             // Production applications should use a real search provider.
//             endpoint: 'https://search.braintrustdata.com/custom_search',
//         });
//         return searchResults;
//     }
// );


export async function getLatestChapter(input: GetLatestChapterInput): Promise<GetLatestChapterOutput> {
  // Bypassing flow since it's deactivated
  // return getLatestChapterFlow(input);
  return { latestChapter: null };
}

// const prompt = ai.definePrompt({
//   name: 'getLatestChapterPrompt',
//   input: { schema: GetLatestChapterInputSchema },
//   output: { schema: GetLatestChapterOutputSchema },
//   tools: [searchTool],
//   prompt: `You are an expert at finding information about manga. Your task is to find the latest released chapter for a given manga title.

//   Use the web search tool to find the most recent chapter number for the manga: "{{mangaTitle}}". 
  
//   Search for things like "{{mangaTitle}} latest chapter" or "{{mangaTitle}} manga updates".
  
//   Analyze the search results to find the most accurate and up-to-date chapter number. If you find a clear chapter number, return it. If you can't be certain or can't find it, return null.`,
// });

// const getLatestChapterFlow = ai.defineFlow(
//   {
//     name: 'getLatestChapterFlow',
//     inputSchema: GetLatestChapterInputSchema,
//     outputSchema: GetLatestChapterOutputSchema,
//   },
//   async (input) => {
//     const { output } = await prompt(input);
//     return output || { latestChapter: null };
//   }
// );
