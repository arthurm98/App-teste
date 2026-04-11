import { Timestamp as FirestoreTimestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

// Flexible timestamp type that allows both full Firestore Timestamp
// and the serialized JSON version (e.g. from local storage)
export type FlexibleTimestamp = FirestoreTimestamp | { seconds: number; nanoseconds: number };

export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  totalChapters: number;
  readChapters: number;
  latestChapter: number; // Novo campo para rastrear o último capítulo conhecido
  genres: string[];
  imageUrl?: string;
  createdAt: FlexibleTimestamp;
  updatedAt: FlexibleTimestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
