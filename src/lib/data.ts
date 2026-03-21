import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";
export type MangaSourceProvider = "jikan" | "kitsu" | "anilist";

export type OnlineManga = {
  id: string;
  sourceProvider: MangaSourceProvider;
  sourceId?: string;
  title: string;
  type: MangaType;
  totalChapters: number;
  status: string;
  score: number | null;
  synopsis: string | null;
  genres: string[];
  imageUrl?: string;
  url: string;
};

export type Manga = {
  id: string;
  sourceProvider?: MangaSourceProvider;
  sourceId?: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  totalChapters: number;
  readChapters: number;
  latestChapter: number;
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUpdateCheckAt?: Timestamp;
  updateFailureCount?: number;
};

const slugifyTitle = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";

export const createMangaLibraryId = (
  sourceProvider: MangaSourceProvider,
  title: string,
  sourceId?: string,
) => (sourceId ? `${sourceProvider}:${sourceId}` : `fb-${sourceProvider}-${slugifyTitle(title)}`);

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
