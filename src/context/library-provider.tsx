
"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Manga, MangaStatus } from '@/lib/data';
import { JikanManga } from '@/lib/jikan-data';
import { useToast } from '@/hooks/use-toast';

interface LibraryContextType {
  library: Manga[];
  addToLibrary: (manga: JikanManga) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateChapter: (mangaId: string, newChapter: number) => void;
  updateStatus: (mangaId: string, newStatus: MangaStatus) => void;
  isMangaInLibrary: (mangaId: number, title?: string) => boolean;
  restoreLibrary: (newLibrary: Manga[]) => void;
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => void;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Helper para gerar um ID único para itens da MangaDex
const generateMangaDexId = (title: string) => `md-${title.toLowerCase().replace(/\s+/g, '-')}`;

const LOCAL_STORAGE_KEY = 'mangatrack-library';

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Manga[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Carrega a biblioteca do localStorage no lado do cliente, após a montagem
  useEffect(() => {
    try {
      const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        setLibrary(JSON.parse(savedLibrary));
      }
    } catch (error) {
      console.error("Erro ao carregar a biblioteca do localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Salva a biblioteca no localStorage sempre que ela mudar
  useEffect(() => {
    // Só salva no localStorage depois que os dados iniciais foram carregados
    if (isLoaded) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(library));
      } catch (error) {
        console.error("Erro ao salvar a biblioteca no localStorage", error);
      }
    }
  }, [library, isLoaded]);

  const isMangaInLibrary = useCallback((mangaId: number, title?: string) => {
    if (mangaId > 0) {
      return library.some(m => m.id === String(mangaId));
    }
    if (title) {
      return library.some(m => m.id === generateMangaDexId(title) || m.title.toLowerCase() === title.toLowerCase());
    }
    return false;
  }, [library]);

  const addToLibrary = useCallback((manga: JikanManga) => {
    if (isMangaInLibrary(manga.mal_id, manga.title)) {
        toast({
            title: "Já está na biblioteca",
            description: `${manga.title} já foi adicionado.`,
        });
        return;
    }

    const mangaId = manga.mal_id > 0 ? String(manga.mal_id) : generateMangaDexId(manga.title);
    
    const newManga: Manga = {
        id: mangaId,
        title: manga.title,
        type: (manga.type as Manga['type']) || "Mangá",
        status: "Planejo Ler",
        coverImageId: '', 
        imageUrl: manga.images.webp.large_image_url || manga.images.webp.image_url,
        totalChapters: manga.chapters || 0,
        readChapters: 0,
        genres: manga.genres.map(g => g.name),
    };
    setLibrary(prev => [...prev, newManga]);
    toast({
        title: "Adicionado à Biblioteca",
        description: `${manga.title} foi adicionado à sua lista 'Planejo Ler'.`,
    });
  }, [isMangaInLibrary, toast]);

  const removeFromLibrary = useCallback((mangaId: string) => {
    const manga = library.find(m => m.id === mangaId);
    setLibrary(prev => prev.filter(m => m.id !== mangaId));
    if (manga) {
        toast({
            title: "Removido da Biblioteca",
            description: `${manga.title} foi removido da sua biblioteca.`,
            variant: "destructive"
        });
    }
  }, [library, toast]);

  const updateChapter = useCallback((mangaId: string, newChapter: number) => {
    let mangaTitleForToast: string | undefined;
    let shouldShowCompletedToast = false;

    setLibrary(prev => prev.map(m => {
        if (m.id === mangaId) {
            const updatedManga = { ...m, readChapters: newChapter };
            
            if (updatedManga.totalChapters > 0 && updatedManga.readChapters >= updatedManga.totalChapters && updatedManga.status !== 'Completo') {
                updatedManga.status = 'Completo';
                mangaTitleForToast = updatedManga.title;
                shouldShowCompletedToast = true;
            } else if (updatedManga.readChapters > 0 && updatedManga.status === 'Planejo Ler') {
                updatedManga.status = 'Lendo';
            } else if (updatedManga.readChapters <= 0 && updatedManga.status === 'Lendo') {
                updatedManga.status = 'Planejo Ler';
            }

            return updatedManga;
        }
        return m;
    }));

    if (shouldShowCompletedToast && mangaTitleForToast) {
        toast({
            title: "Título Concluído!",
            description: `Você terminou de ler ${mangaTitleForToast}.`,
        });
    }
  }, [toast]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    let mangaTitleForToast: string | undefined;

    setLibrary(prev => prev.map(manga => {
        if (manga.id === mangaId) {
            mangaTitleForToast = manga.title;
            const updatedManga = { ...manga, status: newStatus };
            if (newStatus === "Completo" && manga.totalChapters > 0) {
                updatedManga.readChapters = manga.totalChapters;
            } else if (newStatus === "Planejo Ler") {
                updatedManga.readChapters = 0;
            }
            return updatedManga;
        }
        return manga;
    }));

    if (mangaTitleForToast) {
        toast({
            title: "Status Atualizado",
            description: `O status de "${mangaTitleForToast}" foi alterado para ${newStatus}.`,
        });
    }
  }, [toast]);
  
  const updateMangaDetails = useCallback((mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => {
    let mangaTitleForToast: string | undefined;
    setLibrary(prev => prev.map(manga => {
      if (manga.id === mangaId) {
        const updatedManga = { ...manga, ...details };
        mangaTitleForToast = updatedManga.title;

        if (updatedManga.readChapters > updatedManga.totalChapters) {
            updatedManga.readChapters = updatedManga.totalChapters;
        }

        if (updatedManga.totalChapters > 0 && updatedManga.readChapters === updatedManga.totalChapters) {
            updatedManga.status = 'Completo';
        }

        return updatedManga;
      }
      return manga;
    }));

     if (mangaTitleForToast) {
        toast({
            title: "Detalhes Atualizados",
            description: `As informações de "${mangaTitleForToast}" foram salvas.`,
        });
    }
  }, [toast]);

  const restoreLibrary = useCallback((newLibrary: Manga[]) => {
    setLibrary(newLibrary);
  }, []);

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary, updateMangaDetails }}>
      {children}
    </LibraryContext.Provider>
  );
}
