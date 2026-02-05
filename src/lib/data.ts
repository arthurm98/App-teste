import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";
export type EditorialStatus = 'Em Andamento' | 'Finalizado' | 'Pausado' | 'Cancelado' | 'Desconhecido';


/**
 * REGRA DE OURO: O status da obra na biblioteca (`status`) é totalmente independente do
 * seu progresso numérico e de seu status de publicação (`editorialStatus`).
 *
 * - `editorialStatus`: Define se a obra foi concluída pelo autor (Finalizado) ou se ainda está
 *   sendo publicada (Em Andamento). Este campo controla em qual aba principal a obra aparece.
 *
 * - `status`: É uma etiqueta pessoal do usuário. "Completo" aqui significa "terminei de ler",
 *   "Lendo" significa "estou lendo ativamente", e "Planejo Ler" é uma lista de interesse.
 *   Este campo NÃO move a obra entre as abas "Em Andamento" e "Finalizados".
 *
 * - O progresso numérico (readChapters / latestChapter) é apenas um dado informativo e
 *   NUNCA deve alterar o `status` ou o `editorialStatus` de uma obra.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  
  /**
   * O status de publicação da obra, conforme retornado pela API.
   * Fonte da verdade para as abas "Em Andamento" e "Finalizados".
   */
  editorialStatus: EditorialStatus;

  /**
   * Etiqueta de leitura pessoal do usuário. "Completo" aqui significa que o USUÁRIO terminou de ler.
   * Não confunda com a obra ter sido finalizada pelo autor.
   */
  status: MangaStatus;
  
  /**
   * O número total de capítulos de uma obra CONCLUÍDA.
   * Este valor é geralmente definido pelo usuário ou por uma API para obras finalizadas.
   */
  totalChapters: number;
  
  /**
   * O número de capítulos que o usuário marcou como lido.
   * Este valor é controlado exclusivamente pelo usuário.
   */
  readChapters: number;
  
  /**
   * O capítulo mais recente DISPONÍVEL da obra, obtido via API.
   * Representa a disponibilidade atual, não a conclusão. Para obras em andamento,
   * este valor pode aumentar com o tempo. É usado como o denominador no cálculo
   * de progresso (Ex: 120 / 150).
   */
  latestChapter: number;
  
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];