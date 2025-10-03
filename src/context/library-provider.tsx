
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Manga, MangaStatus, mangaLibrary as initialLibrary } from '@/lib/data';
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
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Helper para gerar um ID único para itens da MangaDex
const generateMangaDexId = (title: string) => `md-${title.toLowerCase().replace(/\s+/g, '-')}`;

const LOCAL_STORAGE_KEY = 'mangatrack-library';

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<Manga[]>(() => {
    // Carrega a biblioteca do localStorage na inicialização
    if (typeof window === 'undefined') {
      return initialLibrary;
    }
    try {
      const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedLibrary ? JSON.parse(savedLibrary) : initialLibrary;
    } catch (error) {
      console.error("Erro ao carregar a biblioteca do localStorage", error);
      return initialLibrary;
    }
  });
  
  const { toast } = useToast();

  // Salva a biblioteca no localStorage sempre que ela mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Erro ao salvar a biblioteca no localStorage", error);
    }
  }, [library]);


  const isMangaInLibrary = (mangaId: number, title?: string) => {
    if (mangaId > 0) {
      return library.some(m => m.id === String(mangaId));
    }
    if (title) {
      return library.some(m => m.id === generateMangaDexId(title) || m.title.toLowerCase() === title.toLowerCase());
    }
    return false;
  }

  const addToLibrary = (manga: JikanManga) => {
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
  };

  const removeFromLibrary = (mangaId: string) => {
    const manga = library.find(m => m.id === mangaId);
    setLibrary(prev => prev.filter(m => m.id !== mangaId));
    if (manga) {
        toast({
            title: "Removido da Biblioteca",
            description: `${manga.title} foi removido da sua biblioteca.`,
            variant: "destructive"
        });
    }
  };

  const updateChapter = (mangaId: string, newChapter: number) => {
    setLibrary(prev => prev.map(m => {
        if (m.id === mangaId) {
            const updatedManga = { ...m, readChapters: newChapter };
            
            if (updatedManga.totalChapters > 0 && updatedManga.readChapters >= updatedManga.totalChapters && updatedManga.status !== 'Completo') {
                updatedManga.status = 'Completo';
                toast({
                    title: "Título Concluído!",
                    description: `Você terminou de ler ${updatedManga.title}.`,
                });
            } else if (updatedManga.readChapters > 0 && updatedManga.status === 'Planejo Ler') {
                updatedManga.status = 'Lendo';
            } else if (updatedManga.readChapters <= 0 && updatedManga.status === 'Lendo') {
                updatedManga.status = 'Planejo Ler';
            }

            return updatedManga;
        }
        return m;
    }));
  };

  const updateStatus = (mangaId: string, newStatus: MangaStatus) => {
    setLibrary(prev => prev.map(manga => {
        if (manga.id === mangaId) {
            const updatedManga = { ...manga, status: newStatus };
            if (newStatus === "Completo" && manga.totalChapters > 0) {
                updatedManga.readChapters = manga.totalChapters;
            } else if (newStatus === "Planejo Ler") {
                updatedManga.readChapters = 0;
            } else if (newStatus === "Lendo" && manga.readChapters === 0 && manga.totalChapters > 0) {
                 // updatedManga.readChapters = 1; // Opcional: começar a ler a partir do cap 1
            }
             toast({
                title: "Status Atualizado",
                description: `O status de "${manga.title}" foi alterado para ${newStatus}.`,
            });
            return updatedManga;
        }
        return manga;
    }));
  };

  const restoreLibrary = (newLibrary: Manga[]) => {
    setLibrary(newLibrary);
  }

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary }}>
      {children}
    </LibraryContext.Provider>
  );
}
