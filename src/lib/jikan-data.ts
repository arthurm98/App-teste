// A type definition based on the Jikan API for manga search results
// https://docs.api.jikan.moe/#tag/manga/operation/getMangaSearch

export type JikanManga = {
    mal_id: number;
    url: string;
    images: {
      jpg: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
      };
      webp: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
      };
    };
    title: string;
    type: string | null;
    chapters: number | null;
    status: string;
    score: number | null;
    synopsis: string | null;
    genres: {
        mal_id: number;
        type: string;
        name: string;
        url: string;
    }[];
};
