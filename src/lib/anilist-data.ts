
// A type definition based on the AniList GraphQL API
// https://anilist.github.io/ApiV2-GraphQL-Docs/

export type AniListManga = {
    id: number;
    title: {
      romaji: string;
      english: string;
      native: string;
    };
    coverImage: {
      extraLarge: string;
      large: string;
      color: string;
    };
    format: 'MANGA' | 'NOVEL' | 'ONE_SHOT';
    status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
    description?: string;
    chapters: number | null;
    averageScore: number | null; // 0-100
    genres: string[];
    siteUrl: string;
};
