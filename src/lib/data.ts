
import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

/**
 * Representa um título na biblioteca do usuário.
 * A organização nas abas (status) é 100% controlada pelo usuário.
 * Nenhuma lógica automática deve alterar o campo 'status'.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  /** O status de leitura definido pelo usuário. Determina em qual aba a obra aparece. */
  status: MangaStatus;
  
  /** O número total de capítulos da obra, definido pelo usuário. */
  totalChapters: number;
  
  /** O número de capítulos que o usuário marcou como lido. */
  readChapters: number;
  
  /** O capítulo mais recente lançado, obtido via API. Serve apenas como informação. */
  latestChapter: number;
  
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
