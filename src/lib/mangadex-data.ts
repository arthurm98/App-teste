// A type definition based on the MangaDex API
// https://api.mangadex.org/docs/swagger.html#/Manga/get-manga

export type Relationship = {
    id: string;
    type: 'author' | 'artist' | 'cover_art';
    attributes?: {
      fileName?: string;
      [key: string]: any; // Allow other attributes
    };
};
  
type Tag = {
    id: string;
    type: 'tag';
    attributes: {
      name: { [lang: string]: string };
      description: {};
      group: 'genre' | 'format' | 'theme' | 'content';
      version: number;
    };
};
  
export type MangaDexManga = {
    id: string;
    type: 'manga';
    attributes: {
      title: { [lang: string]: string };
      altTitles: { [lang: string]: string }[];
      description: { [lang: string]: string };
      isLocked: boolean;
      links: { [platform: string]: string };
      originalLanguage: string;
      lastVolume: string | null;
      lastChapter: string | null;
      publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen' | null;
      status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
      year: number | null;
      contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
      tags: Tag[];
      state: 'published';
      chapterNumbersResetOnNewVolume: boolean;
      createdAt: string;
      updatedAt: string;
      version: number;
      availableTranslatedLanguages: string[];
      latestUploadedChapter: string;
    };
    relationships: Relationship[];
};
