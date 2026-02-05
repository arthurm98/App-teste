import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

/**
 * @fileoverview Defines the core data structure for a library item based on user control.
 *
 * HIERARQUIA DE AUTORIDADE (ABSOLUTA E FINAL):
 * 1. Ação do Usuário: O usuário tem controle total e final sobre todos os dados.
 * 2. Status da Biblioteca (`status`): Este campo define em qual aba a obra aparece.
 *    Ele SÓ PODE ser alterado por uma ação explícita e manual do usuário.
 * 3. Progresso Numérico (`readChapters`, `totalChapters`): São dados informativos editáveis
 *    pelo usuário. Eles NUNCA afetam o `status` da obra nem movem a obra entre abas.
 * 4. API Externa: Fornece apenas metadados (título, capa) para exibição e NUNCA sobrepõe
 *    dados do usuário nem altera o `status`.
 * 5. Lógica do Sistema: O sistema NÃO PODE inferir, corrigir ou mover obras
 *    automaticamente. Ele apenas reflete o estado definido pelo usuário.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;

  /**
   * Define em qual aba a obra aparece ("Lendo", "Planejo Ler", "Completo").
   * Este campo é a ÚNICA fonte da verdade para a organização das abas.
   * É alterado APENAS por uma ação manual e explícita do usuário.
   */
  status: MangaStatus;

  /**
   * O número de capítulos que o usuário marcou como lidos.
   * Totalmente editável pelo usuário e NÃO afeta o `status`.
   */
  readChapters: number;

  /**
   * O número total de capítulos da obra, conforme definido pelo usuário.
   * Usado para cálculo de progresso, mas NÃO afeta o `status`.
   */
  totalChapters: number;
  
  /**
   * O capítulo mais recente disponível, obtido da API via sincronização MANUAL.
   * Este campo é apenas para fins informativos.
   * NUNCA sobrepõe `totalChapters` ou afeta o `status`.
   */
  latestChapter: number;

  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// The initial library is empty; data is loaded from cloud or localStorage.
export const mangaLibrary: Manga[] = [];
