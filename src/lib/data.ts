import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

/**
 * @fileoverview Define a estrutura de dados central para um item da biblioteca.
 *
 * LÓGICA DE STATUS AUTOMATIZADA:
 * O sistema agora classifica as obras em abas automaticamente com base em regras claras.
 *
 * 1.  **`status` (Status da Biblioteca):** Determina em qual aba a obra aparece.
 *     - É definido AUTOMATICAMENTE pelo sistema.
 *     - Regras de Classificação:
 *       - Se `readChapters === 0` -> `status` = "Planejo Ler"
 *       - Se `readChapters > 0` E (`readChapters < totalChapters` OU `editorialStatus !== 'Finalizado'`) -> `status` = "Lendo"
 *       - Se `readChapters >= totalChapters` E `editorialStatus === 'Finalizado'` -> `status` = "Completo"
 *
 * 2.  **`editorialStatus` (Status da Publicação):** Armazena o status oficial da obra
 *     (ex: "Em Andamento", "Finalizado") obtido da API. É um pilar da automação.
 *
 * 3.  **`readChapters` e `totalChapters`:** Controlados pelo usuário. Acionam a lógica
 *     de reclassificação automática sempre que são alterados.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  readChapters: number;
  totalChapters: number;
  latestChapter: number;
  editorialStatus: 'Em Andamento' | 'Finalizado' | 'Desconhecido';
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// The initial library is empty; data is loaded from cloud or localStorage.
export const mangaLibrary: Manga[] = [];
