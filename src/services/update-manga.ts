
import { JikanManga } from "@/lib/jikan-data";
import { MangaDexManga, Relationship } from "@/lib/mangadex-data";

interface MangaUpdateInfo {
    totalChapters: number;
}

// Busca as informações mais recentes de um mangá na API Jikan (MyAnimeList)
async function getInfoFromJikan(mangaId: string): Promise<MangaUpdateInfo | null> {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga/${mangaId}`);
        if (!response.ok) return null;
        const data = await response.json();
        const manga: JikanManga = data.data;
        if (manga && manga.chapters) {
            return { totalChapters: manga.chapters };
        }
    } catch (error) {
        console.error(`Jikan API request failed for mangaId ${mangaId}:`, error);
    }
    return null;
}

// Busca as informações mais recentes de um mangá na API MangaDex
async function getInfoFromMangaDex(mangaId: string): Promise<MangaUpdateInfo | null> {
    try {
        const response = await fetch(`https://api.mangadex.org/manga/${mangaId}`);
        if (!response.ok) return null;
        const data = await response.json();
        const manga: MangaDexManga = data.data;
        if (manga && manga.attributes.lastChapter) {
            return { totalChapters: parseFloat(manga.attributes.lastChapter) };
        }
    } catch (error) {
        console.error(`MangaDex API request failed for mangaId ${mangaId}:`, error);
    }
    return null;
}


export async function getLatestMangaInfo(mangaId: string, title: string): Promise<MangaUpdateInfo | null> {
    // Se o ID indica que é do MangaDex
    if (mangaId.startsWith('md-')) {
        // O ID do MangaDex está no formato 'md-xxxxxxxx-xxxx...'
        // Precisamos extrair o UUID real.
        const dexId = mangaId.substring(3); // Remove o prefixo 'md-'
        const dexInfo = await getInfoFromMangaDex(dexId);
        if (dexInfo) return dexInfo;
    } else { // Se o ID for numérico, provavelmente é do MyAnimeList (Jikan)
        const jikanInfo = await getInfoFromJikan(mangaId);
        if (jikanInfo) return jikanInfo;
    }

    // Como fallback, se a primeira tentativa falhar, podemos tentar buscar pelo título em outras APIs
    // Esta parte pode ser expandida no futuro
    console.log(`Fallback: Could not update ${title} with its primary ID. Further search can be implemented.`);
    return null;
}

    