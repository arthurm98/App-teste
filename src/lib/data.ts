
import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  totalChapters: number;
  readChapters: number;
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];

    