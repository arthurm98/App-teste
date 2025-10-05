
// A type definition based on the MangaUpdates API for manga search results
// https://api.mangaupdates.com/v1/

export type MangaUpdatesManga = {
    series_id: number;
    title: string;
    url: string;
    description: string;
    image: {
        url: {
            original: string;
            thumb: string;
        };
        height: number;
        width: number;
    } | null;
    type: 'Manga' | 'Manhwa' | 'Manhua' | 'Novel' | 'OEL' | 'Doujinshi' | 'Artbook';
    year: string;
    bayesian_rating: number | null;
    latest_chapter: number | null;
    genres: {
        genre_id: number;
        genre: string;
    }[];
};
