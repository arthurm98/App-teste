import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

/**
 * REGRA DE OURO: O `status` da obra é totalmente independente do progresso numérico.
 * - `status` define a aba onde a obra aparece (Lendo, Completo, etc.).
 * - O progresso (`readChapters`, `totalChapters`, `latestChapter`) é apenas um dado informativo.
 * - Alterar o progresso numérico NUNCA deve alterar o `status` ou mover a obra entre abas.
 * - Apenas o usuário, através da função `updateStatus`, pode mudar o status de uma obra.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  
  /**
   * Define a categoria da obra na biblioteca. É a única fonte de verdade para
   * determinar se uma obra está em "Lendo", "Planejo Ler" ou "Completo".
   * Este campo só pode ser alterado por uma ação explícita do usuário.
   */
  status: MangaStatus;
  
  /**
   * O número total de capítulos de uma obra CONCLUÍDA.
   * Este valor é geralmente definido pelo usuário ou por uma API para obras finalizadas.
   * Não deve ser usado para inferir o progresso de obras em andamento.
   * O usuário tem autoridade para editar este valor.
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
