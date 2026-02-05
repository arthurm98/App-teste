
import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  
  /**
   * O número total de capítulos da obra, se for conhecido e finalizado.
   * Para obras em andamento, pode ser 0 ou o total planejado.
   * Este campo é definido pelo usuário ou por APIs para obras concluídas.
   */
  totalChapters: number;
  
  /**
   * O número de capítulos que o usuário marcou como lido.
   */
  readChapters: number;
  
  /**
   * O capítulo mais recente lançado, obtido através da API.
   * Usado para calcular o progresso de obras em andamento e não deve ser
   * interpretado como o total final da obra.
   */
  latestChapter: number;
  
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
