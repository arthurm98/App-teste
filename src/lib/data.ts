import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";
export type EditorialStatus = 'Em Andamento' | 'Finalizado' | 'Pausado' | 'Cancelado' | 'Desconhecido';

/**
 * @fileoverview Este arquivo define a estrutura de dados principal para um item da biblioteca.
 * 
 * REGRA DE HIERARQUIA: Usuário > UI > API > Lógica do Sistema.
 * A intenção do usuário é a fonte final da verdade.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  
  /**
   * O status de publicação da obra, conforme retornado pela API (ex: 'Em Andamento', 'Finalizado').
   * Este campo é puramente informativo e NUNCA deve ser usado para mover uma obra entre abas.
   */
  editorialStatus: EditorialStatus;

  /**
   * A etiqueta de leitura pessoal do usuário, que define em qual aba a obra aparece.
   * Este campo é 100% controlado pelo usuário através da interface.
   * 'Lendo', 'Completo', 'Planejo Ler' são intenções do usuário, não estados inferidos.
   */
  status: MangaStatus;
  
  /**
   * O número total de capítulos, definido pelo usuário.
   * Este valor tem prioridade sobre qualquer dado da API e é editável a qualquer momento.
   */
  totalChapters: number;
  
  /**
   * O número de capítulos que o usuário marcou como lido.
   * Este valor é controlado exclusivamente pelo usuário.
   */
  readChapters: number;
  
  /**
   * O capítulo mais recente disponível, obtido via API pela sincronização manual.
   * Este campo é apenas para exibição e referência.
   * NUNCA deve sobrescrever 'totalChapters' nem ser usado para lógica de classificação.
   */
  latestChapter: number;
  
  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// A biblioteca inicial foi removida. Os dados serão carregados da nuvem ou do localStorage.
export const mangaLibrary: Manga[] = [];
