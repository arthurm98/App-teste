import type { Manga } from "@/lib/data";
import type { JikanManga } from "@/lib/jikan-data";
import type { KitsuManga } from "@/lib/kitsu-data";
import type { AniListManga } from "@/lib/anilist-data";

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

async function getInfoFromJikanById(sourceId: string): Promise<MangaUpdateInfo | null> {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga/${sourceId}`);
    if (!response.ok) return null;

    const data = await response.json();
    const manga: JikanManga | undefined = data.data;

    if (manga) {
      return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
    }
  } catch (error) {
    console.error(`Jikan API request failed for sourceId ${sourceId}:`, error);
  }
  return null;
}

async function getInfoFromJikanByTitle(title: string): Promise<MangaUpdateInfo | null> {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    const manga: JikanManga | undefined = (data.data || [])[0];

    if (manga) {
      return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
    }
  } catch (error) {
    console.error(`Jikan API request failed for title ${title}:`, error);
  }
  return null;
}

async function getInfoFromKitsuById(sourceId: string): Promise<MangaUpdateInfo | null> {
  try {
    const response = await fetch(`https://kitsu.io/api/edge/manga/${sourceId}`);
    if (!response.ok) return null;

    const data = await response.json();
    const manga: KitsuManga | undefined = data.data;

    if (manga) {
      return { totalChapters: manga.attributes.chapterCount ?? null, latestChapter: manga.attributes.chapterCount ?? null };
    }
  } catch (error) {
    console.error(`Kitsu API request failed for sourceId ${sourceId}:`, error);
  }
  return null;
}

async function getInfoFromKitsuByTitle(title: string): Promise<MangaUpdateInfo | null> {
  try {
    const response = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`);
    if (!response.ok) return null;

    const data = await response.json();
    const manga: KitsuManga | undefined = (data.data || [])[0];

    if (manga) {
      return { totalChapters: manga.attributes.chapterCount ?? null, latestChapter: manga.attributes.chapterCount ?? null };
    }
  } catch (error) {
    console.error(`Kitsu API request failed for title ${title}:`, error);
  }
  return null;
}

async function getInfoFromAniListById(sourceId: string): Promise<MangaUpdateInfo | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        chapters
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { id: Number(sourceId) } }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const manga: AniListManga | undefined = data.data?.Media;

    if (manga) {
      return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
    }
  } catch (error) {
    console.error(`AniList API request failed for sourceId ${sourceId}:`, error);
  }
  return null;
}

async function getInfoFromAniListByTitle(title: string): Promise<MangaUpdateInfo | null> {
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
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const manga: AniListManga | undefined = data.data?.Media;

    if (manga) {
      return { totalChapters: manga.chapters ?? null, latestChapter: manga.chapters ?? null };
    }
  } catch (error) {
    console.error(`AniList API request failed for title ${title}:`, error);
  }
  return null;
}

const legacyProviderFromId = (mangaId: string): ProviderName | undefined => {
  if (mangaId.startsWith('anilist:')) return 'anilist';
  if (mangaId.startsWith('kitsu:')) return 'kitsu';
  if (mangaId.startsWith('jikan:')) return 'jikan';
  return undefined;
};

export async function getLatestMangaInfo(manga: Pick<Manga, 'id' | 'title' | 'sourceProvider' | 'sourceId'>): Promise<MangaUpdateInfo | null> {
  console.log('Searching for manga updates using traditional APIs...');
  console.log('[update-manga] Provider health snapshot:', getProviderHealthSnapshot());

  const sourceProvider = manga.sourceProvider ?? legacyProviderFromId(manga.id) ?? 'jikan';
  const sourceId = manga.sourceId ?? (sourceProvider === 'jikan' && /^\d+$/.test(manga.id) ? manga.id : undefined);

  const providerStrategies: Record<ProviderName, Searcher[]> = {
    jikan: [
      ...(sourceId ? [{ provider: 'jikan' as const, run: () => getInfoFromJikanById(sourceId) }] : []),
      { provider: 'jikan', run: () => getInfoFromJikanByTitle(manga.title) },
      { provider: 'kitsu', run: () => getInfoFromKitsuByTitle(manga.title) },
      { provider: 'anilist', run: () => getInfoFromAniListByTitle(manga.title) },
    ],
    anilist: [
      ...(sourceId ? [{ provider: 'anilist' as const, run: () => getInfoFromAniListById(sourceId) }] : []),
      { provider: 'anilist', run: () => getInfoFromAniListByTitle(manga.title) },
    ],
    kitsu: [
      ...(sourceId ? [{ provider: 'kitsu' as const, run: () => getInfoFromKitsuById(sourceId) }] : []),
      { provider: 'kitsu', run: () => getInfoFromKitsuByTitle(manga.title) },
    ],
  };

  for (const searcher of providerStrategies[sourceProvider]) {
    try {
      const result = await runSearcher(searcher);
      if (result) {
        console.log(`[update-manga] ${sourceProvider} retornou dados para "${manga.title}".`);
        return result;
      }
    } catch (error) {
      console.warn(`[update-manga] Falha ao consultar ${searcher.provider} para "${manga.title}"`, error);
    }
  }

  console.log(`All update checks failed for "${manga.title}".`);
  return null;
}
