// A type definition based on the Kitsu API for manga search results
// https://kitsu.io/api/docs/#tag/manga/operation/getMangaList

export type KitsuManga = {
    id: string;
    type: 'manga';
    attributes: {
        slug: string;
        synopsis: string;
        canonicalTitle: string;
        averageRating: string | null;
        chapterCount: number | null;
        mangaType: 'manga' | 'novel' | 'manhwa' | 'manhua' | 'one_shot' | 'doujin';
        posterImage: {
            tiny: string;
            small: string;
            medium: string;
            large: string;
            original: string;
        } | null;
        status: 'current' | 'finished' | 'tba' | 'unreleased' | 'upcoming';
    }
}
