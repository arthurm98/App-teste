import * as z from 'zod';
import { errorEmitter } from '../../firebase/error-emitter';
import { ai } from '../genkit';

export const getLatestChapterFlow = ai.defineFlow(
  {
    name: 'getLatestChapter',
    inputSchema: z.object({
      mangaTitle: z.string(),
      cachedChapter: z.number().optional()
    }),
    outputSchema: z.number().nullable(),
  },
  async ({ mangaTitle, cachedChapter }) => {
    try {
      // Simulate an AI call to get the latest chapter with a 15-second timeout
      const aiPromise = new Promise<number>((resolve) => {
        // Mock AI logic here, could be an actual Genkit model call
        setTimeout(() => resolve(cachedChapter ? cachedChapter + 1 : 1), 1000);
      });

      let timeoutHandle: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('AI call timed out after 15 seconds')), 15000);
      });

      const latestChapter = await Promise.race([aiPromise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutHandle);
      });
      return latestChapter;
    } catch (error) {
      console.error(`Error in getLatestChapterFlow for ${mangaTitle}:`, error);

      // Emit error using the central error system
      errorEmitter.emit('ai-flow-error', {
        flowName: 'getLatestChapter',
        error,
        context: { mangaTitle, cachedChapter }
      });

      // Graceful degradation: return the cached chapter if available.
      if (cachedChapter !== undefined) {
          console.warn(`Falling back to cached chapter ${cachedChapter} due to error.`);
          return cachedChapter;
      }

      return null;
    }
  }
);
