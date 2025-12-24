
import { JikanManga } from "@/lib/jikan-data";
import { KitsuManga } from "@/lib/kitsu-data";
import { AniListManga } from "@/lib/anilist-data";


interface MangaUpdateInfo {
    totalChapters: number | null;
    latestChapter: number | null;
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
            return { totalChapters: manga.chapters, latestChapter: manga.chapters };
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
            return { totalChapters: manga.attributes.chapterCount, latestChapter: manga.attributes.chapterCount };
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
            return { totalChapters: manga.chapters, latestChapter: manga.chapters };
        }
    } catch (error) {
        console.error(`AniList API request failed for title ${title}:`, error);
    }
    return null;
}

// Função principal que tenta buscar em várias APIs em cascata.
export async function getLatestMangaInfo(mangaId: string, title: string): Promise<MangaUpdateInfo | null> {
    
    console.log("Searching for manga updates using traditional APIs...");

    const fallbackSearchers = [
        () => getInfoFromJikan('', title),
        () => getInfoFromKitsu(title),
        () => getInfoFromAniList(title),
    ];

    // Tenta a fonte primária (Jikan/Anilist ID se for um número)
    if (!isNaN(Number(mangaId))) {
        const primaryInfo = await getInfoFromJikan(mangaId);
        if (primaryInfo) return primaryInfo;
    }
    
    // Se a fonte primária falhar ou não for aplicável, itera sobre os fallbacks
    for (const searcher of fallbackSearchers) {
        try {
            const result = await searcher();
            if (result && (result.totalChapters || result.latestChapter)) {
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
