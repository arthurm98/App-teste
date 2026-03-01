
import { JikanManga } from "@/lib/jikan-data";
import { KitsuManga } from "@/lib/kitsu-data";
import { AniListManga } from "@/lib/anilist-data";


type ProviderName = "jikan" | "kitsu" | "anilist";

interface MangaUpdateInfo {
    totalChapters: number | null;
    latestChapter: number | null;
}

interface ProviderHealth {
    consecutiveFailures: number;
    blockedUntil: number;
}

interface Searcher {
    provider: ProviderName;
    run: () => Promise<MangaUpdateInfo | null>;
}

const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 5 * 60_000;
const providerHealthState: Record<ProviderName, ProviderHealth> = {
    jikan: { consecutiveFailures: 0, blockedUntil: 0 },
    kitsu: { consecutiveFailures: 0, blockedUntil: 0 },
    anilist: { consecutiveFailures: 0, blockedUntil: 0 },
};

const getProviderHealthSnapshot = () => ({
    jikan: { ...providerHealthState.jikan },
    kitsu: { ...providerHealthState.kitsu },
    anilist: { ...providerHealthState.anilist },
});

function isProviderBlocked(provider: ProviderName): boolean {
    return Date.now() < providerHealthState[provider].blockedUntil;
}

function registerProviderSuccess(provider: ProviderName) {
    providerHealthState[provider].consecutiveFailures = 0;
    providerHealthState[provider].blockedUntil = 0;
}

function registerProviderFailure(provider: ProviderName) {
    const providerState = providerHealthState[provider];
    providerState.consecutiveFailures += 1;

    const backoff = Math.min(
        BASE_BACKOFF_MS * 2 ** (providerState.consecutiveFailures - 1),
        MAX_BACKOFF_MS,
    );
    providerState.blockedUntil = Date.now() + backoff;

    console.warn(
        `[update-manga] Provider ${provider} falhou ${providerState.consecutiveFailures}x seguidas. Backoff de ${Math.round(backoff / 1000)}s aplicado.`,
    );
}

async function runSearcher({ provider, run }: Searcher): Promise<MangaUpdateInfo | null> {
    if (isProviderBlocked(provider)) {
        console.log(`[update-manga] Ignorando ${provider} devido a backoff ativo.`);
        return null;
    }

    try {
        const result = await run();
        if (result && (result.totalChapters || result.latestChapter)) {
            registerProviderSuccess(provider);
            return result;
        }
        registerProviderFailure(provider);
        return null;
    } catch (error) {
        registerProviderFailure(provider);
        throw error;
    }
}

// Busca as informações mais recentes de um mangá na API Jikan (MyAnimeList)
async function getInfoFromJikan(mangaId: string, title?: string): Promise<MangaUpdateInfo | null> {
    try {
        const url = mangaId
            ? `https://api.jikan.moe/v4/manga/${mangaId}`
            : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title || '')}&limit=1`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        const manga: JikanManga = mangaId ? data.data : (data.data || [])[0];

        if (manga) {
            return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
        }
    } catch (error) {
        console.error(`Jikan API request failed for mangaId ${mangaId}:`, error);
    }
    return null;
}

// Busca as informações mais recentes na API Kitsu
async function getInfoFromKitsu(title: string): Promise<MangaUpdateInfo | null> {
    try {
        const response = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`);
        if (!response.ok) return null;

        const data = await response.json();
        const manga: KitsuManga = (data.data || [])[0];

        if (manga) {
            return { totalChapters: manga.attributes.chapterCount ?? null, latestChapter: manga.attributes.chapterCount ?? null };
        }
    } catch (error) {
        console.error(`Kitsu API request failed for title ${title}:`, error);
    }
    return null;
}

// Busca as informações mais recentes na API AniList
async function getInfoFromAniList(title: string): Promise<MangaUpdateInfo | null> {
     const query = `
      query ($search: String) {
        Media(search: $search, type: MANGA, sort: [SEARCH_MATCH]) {
          chapters
        }
      }
    `;
    const variables = { search: title };

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        const manga: AniListManga = data.data?.Media;

        if (manga) {
            return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
        }
    } catch (error) {
        console.error(`AniList API request failed for title ${title}:`, error);
    }
    return null;
}

// Função principal que tenta buscar em várias APIs em cascata.
export async function getLatestMangaInfo(mangaId: string, title: string): Promise<MangaUpdateInfo | null> {

    console.log("Searching for manga updates using traditional APIs...");
    console.log('[update-manga] Provider health snapshot:', getProviderHealthSnapshot());

    const fallbackSearchers: Searcher[] = [
        { provider: "jikan", run: () => getInfoFromJikan('', title) },
        { provider: "kitsu", run: () => getInfoFromKitsu(title) },
        { provider: "anilist", run: () => getInfoFromAniList(title) },
    ];

    // Tenta a fonte primária (Jikan/Anilist ID se for um número)
    if (!isNaN(Number(mangaId))) {
        const primaryInfo = await runSearcher({ provider: "jikan", run: () => getInfoFromJikan(mangaId) });
        if (primaryInfo) return primaryInfo;
    }

    // Se a fonte primária falhar ou não for aplicável, itera sobre os fallbacks
    for (const searcher of fallbackSearchers) {
        try {
            const result = await runSearcher(searcher);
            if (result) {
                console.log(`Fallback successful for "${title}"`);
                return result;
            }
        } catch (error) {
            // Apenas loga o erro e continua para a próxima API
            console.warn(`A fallback searcher failed for "${title}"`, error);
        }
    }

    console.log(`All update checks failed for "${title}".`);
    return null;
}
