
import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";
export type PublicationStatus = "Finished" | "Publishing" | "Unknown";

/**
 * Representa um título na biblioteca do usuário.
 * O controle sobre o status e progresso é 100% manual.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  /** O status de leitura definido pelo usuário. Determina em qual aba a obra aparece. */
  status: MangaStatus;
  
  /** O status de publicação oficial da obra. */
  publicationStatus: PublicationStatus;
  
  /** O número total de capítulos da obra, definido pelo usuário. */
  totalChapters: number;
  
  /** O número de capítulos que o usuário marcou como lido. */
  readChapters: number;
  
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
