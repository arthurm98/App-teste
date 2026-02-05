'use server';
/**
 * @fileOverview An AI flow for searching manga across the web.
 *
 * - searchManga - A function that searches for manga and returns structured data.
 * - SearchMangaOutput - The return type for the searchManga function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchMangaInputSchema = z.object({
  query: z.string().describe('The search query for the manga.'),
});

// Schema mirroring JikanManga for compatibility with the existing OnlineMangaCard component
const MangaResultSchema = z.object({
    mal_id: z.number().describe("The MyAnimeList ID if available, otherwise use another unique ID or 0."),
    url: z.string().url().describe("A relevant URL for the manga, like its MyAnimeList, Kitsu, or AniList page."),
    title: z.string().describe("The primary title of the manga."),
    images: z.object({
        webp: z.object({
            large_image_url: z.string().url().describe("The URL for the large cover image in WebP format."),
            image_url: z.string().url().describe("The URL for the standard cover image in WebP format."),
        }),
    }),
    type: z.string().nullish().describe("The type of the publication (e.g., 'Manga', 'Manhwa', 'Novel')."),
    chapters: z.number().nullish().describe("The total number of chapters if known."),
    status: z.string().describe("The publication status (e.g., 'Finished', 'Publishing')."),
    score: z.number().nullish().describe("The average user score, typically out of 10."),
    synopsis: z.string().nullish().describe("A brief summary of the manga."),
    genres: z.array(z.object({ name: z.string() })).describe("A list of genres associated with the manga."),
});

const SearchMangaOutputSchema = z.object({
  results: z.array(MangaResultSchema),
});

export type SearchMangaOutput = z.infer<typeof SearchMangaOutputSchema>;

const searchMangaPrompt = ai.definePrompt({
  name: 'searchMangaPrompt',
  input: {schema: SearchMangaInputSchema},
  output: {schema: SearchMangaOutputSchema},
  prompt: `You are an expert manga database aggregator. Your task is to search the web for manga, manhwa, and novels matching the user's query and return a structured list of the top 15 most relevant results.

Search Query: {{{query}}}

For each result, provide the following information:
- A unique ID (MyAnimeList ID is preferred, but any unique ID will do. Use 0 if none is found).
- The most common title.
- A high-quality cover image URL (use WebP format if possible).
- The type (Manga, Manhwa, Webtoon, Novel).
- The total chapter count, if known.
- The current publication status (e.g., 'Finished', 'Releasing').
- The average user score (normalized to a 1-10 scale if necessary).
- A brief synopsis.
- A list of genres.
- A relevant URL to the manga's page on a major database like MyAnimeList, AniList, or Kitsu.

Return the results in a structured JSON format. Prioritize accuracy and relevance.`,
});


const searchMangaFlow = ai.defineFlow(
  {
    name: 'searchMangaFlow',
    inputSchema: SearchMangaInputSchema,
    outputSchema: SearchMangaOutputSchema,
  },
  async input => {
    const {output} = await searchMangaPrompt(input);
    return output!;
  }
);

export async function searchManga(query: string): Promise<SearchMangaOutput> {
  return searchMangaFlow({ query });
}
