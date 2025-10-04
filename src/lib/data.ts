export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon";

export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  coverImageId: string;
  totalChapters: number;
  readChapters: number;
  genres: string[];
  imageUrl?: string;
};

// A biblioteca inicial foi removida. Os dados serão carregados diretamente do localStorage.
export const mangaLibrary: Manga[] = [];
