import test from "node:test";
import assert from "node:assert";
import { getLatestMangaInfo } from "./update-manga.ts";

test("getLatestMangaInfo fallback loop error handling", async (t) => {
    // Store original fetch
    const originalFetch = global.fetch;

    // Suppress console.error and console.warn during tests
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};

    t.after(() => {
        // Restore fetch and console after all tests in this suite
        global.fetch = originalFetch;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    });

    await t.test("continues to next fallback when primary and early fallbacks fail", async () => {
        let fetchCallCount = 0;

        // Mock fetch to fail for Jikan and Kitsu, but succeed for AniList
        global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            fetchCallCount++;
            const urlString = input.toString();

            if (urlString.includes("api.jikan.moe")) {
                // Primary and first fallback fail
                throw new Error("Jikan API is down");
            } else if (urlString.includes("kitsu.io")) {
                // Second fallback fails
                throw new Error("Kitsu API is down");
            } else if (urlString.includes("graphql.anilist.co")) {
                // Third fallback succeeds
                return new Response(JSON.stringify({
                    data: {
                        Media: {
                            chapters: 100
                        }
                    }
                }), { status: 200 });
            }

            return new Response(null, { status: 404 });
        };

        // Call the function with an invalid mangaId to force the fallback loop
        const result = await getLatestMangaInfo("invalid-id", "Test Manga");

        // It should eventually return the AniList data
        assert.deepStrictEqual(result, { totalChapters: 100, latestChapter: 100 });
        // It should have attempted all 3 APIs (Jikan, Kitsu, AniList)
        assert.strictEqual(fetchCallCount, 3);
    });

    await t.test("returns null gracefully when all fallbacks fail", async () => {
        let fetchCallCount = 0;

        // Mock fetch to fail for all APIs
        global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            fetchCallCount++;
            throw new Error("API is completely down");
        };

        // Call the function with an invalid mangaId to force the fallback loop
        const result = await getLatestMangaInfo("invalid-id", "Test Manga");

        // It should return null when everything fails
        assert.strictEqual(result, null);
        // It should have attempted all 3 APIs (Jikan, Kitsu, AniList)
        assert.strictEqual(fetchCallCount, 3);
    });
});
