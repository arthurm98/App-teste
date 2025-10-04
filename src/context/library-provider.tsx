
"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, writeBatch, Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import { Manga, MangaStatus } from '@/lib/data';
import { JikanManga } from '@/lib/jikan-data';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface LibraryContextType {
  library: Manga[];
  addToLibrary: (manga: JikanManga) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateChapter: (mangaId: string, newChapter: number) => void;
  updateStatus: (mangaId: string, newStatus: MangaStatus) => void;
  isMangaInLibrary: (mangaId: number, title?: string) => boolean;
  restoreLibrary: (newLibrary: Manga[]) => void;
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => void;
  isLoading: boolean;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const generateMangaDexId = (title: string) => `md-${title.toLowerCase().replace(/\s+/g, '-')}`;
const LOCAL_STORAGE_KEY = 'mangatrack-library';

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [localLibrary, setLocalLibrary] = useState<Manga[]>([]);
  const [cloudLibrary, setCloudLibrary] = useState<Manga[]>([]);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(true);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Load local library from LocalStorage
  useEffect(() => {
    try {
      const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        setLocalLibrary(JSON.parse(savedLibrary));
      }
    } catch (error) {
      console.error("Erro ao carregar a biblioteca do localStorage", error);
    } finally {
      setIsLocalLoaded(true);
    }
  }, []);

  // Save local library to LocalStorage when it changes
  useEffect(() => {
    if (isLocalLoaded && !user) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localLibrary));
      } catch (error) {
        console.error("Erro ao salvar a biblioteca no localStorage", error);
      }
    }
  }, [localLibrary, isLocalLoaded, user]);

  // Cloud library listener
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && firestore) {
      setIsCloudLoading(true);
      const libCollection = collection(firestore, 'users', user.uid, 'library');
      unsubscribe = onSnapshot(libCollection, snapshot => {
        const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Manga));
        setCloudLibrary(cloudData);
        setIsCloudLoading(false);
      }, error => {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: libCollection.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
          variant: "destructive",
          title: "Erro ao buscar dados",
          description: "Não foi possível carregar sua biblioteca da nuvem.",
        });
        setIsCloudLoading(false);
      });
    } else {
      setCloudLibrary([]);
      setIsCloudLoading(false);
    }
    return () => unsubscribe?.();
  }, [user, firestore, toast]);

  // Sync local to cloud on login
  useEffect(() => {
    if (user && firestore && isLocalLoaded && !isCloudLoading && localLibrary.length > 0) {
      const syncLocalToCloud = () => {
        const batch = writeBatch(firestore);
        let itemsToSync = 0;
        
        localLibrary.forEach(localManga => {
          const cloudManga = cloudLibrary.find(m => m.id === localManga.id);
          if (!cloudManga) {
            const docRef = doc(firestore, 'users', user.uid, 'library', localManga.id);
            const mangaData = { ...localManga, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
            batch.set(docRef, mangaData);
            itemsToSync++;
          }
        });
        
        if (itemsToSync > 0) {
           batch.commit().then(() => {
            toast({
              title: "Sincronização Concluída",
              description: `${itemsToSync} título(s) da sua biblioteca local foram salvos na nuvem.`
            });
            setLocalLibrary([]);
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          }).catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/library`,
                operation: 'write',
                requestResourceData: localLibrary,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
              variant: "destructive",
              title: "Erro na Sincronização",
              description: "Não foi possível sincronizar sua biblioteca local com a nuvem."
            });
          });
        }
      };

      syncLocalToCloud();
    }
  }, [user, firestore, isLocalLoaded, isCloudLoading, localLibrary, cloudLibrary, toast]);

  const library = useMemo(() => (user ? cloudLibrary : localLibrary), [user, cloudLibrary, localLibrary]);
  const isLoading = useMemo(() => (user ? isCloudLoading : !isLocalLoaded), [user, isCloudLoading, isLocalLoaded]);

  const isMangaInLibrary = useCallback((mangaId: number, title?: string) => {
    const checkId = mangaId > 0 ? String(mangaId) : generateMangaDexId(title || '');
    return library.some(m => m.id === checkId);
  }, [library]);

  const addToLibrary = useCallback((manga: JikanManga) => {
    if (isMangaInLibrary(manga.mal_id, manga.title)) {
      toast({ title: "Já está na biblioteca", description: `${manga.title} já foi adicionado.` });
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

    if (user && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      const dataToSave = { ...newManga, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
    } else {
      setLocalLibrary(prev => [...prev, newManga]);
    }
    toast({ title: "Adicionado à Biblioteca", description: `${manga.title} foi adicionado à sua lista 'Planejo Ler'.` });
  }, [isMangaInLibrary, toast, user, firestore]);

  const removeFromLibrary = useCallback((mangaId: string) => {
    const manga = library.find(m => m.id === mangaId);
    if (user && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'library', mangaId));
    } else {
      setLocalLibrary(prev => prev.filter(m => m.id !== mangaId));
    }
    if (manga) {
      toast({ title: "Removido da Biblioteca", description: `${manga.title} foi removido.`, variant: "destructive" });
    }
  }, [library, toast, user, firestore]);

  const updateLibraryItem = (mangaId: string, updates: Partial<Manga> & { updatedAt: Timestamp }) => {
    if (user && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      updateDocumentNonBlocking(docRef, updates);
    } else {
      setLocalLibrary(prev => prev.map(m => m.id === mangaId ? { ...m, ...updates } : m));
    }
  };

  const updateChapter = useCallback((mangaId: string, newChapter: number) => {
    const manga = library.find(m => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { readChapters: newChapter };
    let shouldShowCompletedToast = false;

    if (manga.totalChapters > 0 && newChapter >= manga.totalChapters && manga.status !== 'Completo') {
      updates.status = 'Completo';
      shouldShowCompletedToast = true;
    } else if (newChapter > 0 && manga.status === 'Planejo Ler') {
      updates.status = 'Lendo';
    } else if (newChapter <= 0 && manga.status === 'Lendo') {
      updates.status = 'Planejo Ler';
    }
    
    updateLibraryItem(mangaId, { ...updates, updatedAt: Timestamp.now() });

    if (shouldShowCompletedToast) {
      toast({ title: "Título Concluído!", description: `Você terminou de ler ${manga.title}.` });
    }
  }, [library, toast]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    const manga = library.find(m => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { status: newStatus };
    if (newStatus === "Completo" && manga.totalChapters > 0) {
      updates.readChapters = manga.totalChapters;
    } else if (newStatus === "Planejo Ler") {
      updates.readChapters = 0;
    }

    updateLibraryItem(mangaId, { ...updates, updatedAt: Timestamp.now() });
    toast({ title: "Status Atualizado", description: `O status de "${manga.title}" foi alterado para ${newStatus}.` });
  }, [library, toast]);
  
  const updateMangaDetails = useCallback((mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => {
     const manga = library.find(m => m.id === mangaId);
     if (!manga) return;
     
     const updates: Partial<Manga> = {...details};
     
     if (details.totalChapters !== undefined && manga.readChapters > details.totalChapters) {
        updates.readChapters = details.totalChapters;
     }
     if (details.totalChapters !== undefined && manga.readChapters === details.totalChapters && manga.totalChapters > 0) {
        updates.status = 'Completo';
     }

     updateLibraryItem(mangaId, {...updates, updatedAt: Timestamp.now() });
     toast({ title: "Detalhes Atualizados", description: `As informações de "${manga.title}" foram salvas.` });
  }, [library, toast]);

  const restoreLibrary = useCallback((newLibrary: Manga[]) => {
    if (user && firestore) {
      // For cloud, this would be a more complex batch write operation.
      // For now, we inform the user.
       toast({
        variant: "destructive",
        title: "Função indisponível",
        description: "A restauração de backup não é suportada para contas logadas no momento.",
      });
    } else {
      setLocalLibrary(newLibrary);
      toast({ title: "Restauração Concluída", description: "Sua biblioteca local foi restaurada." });
    }
  }, [user, firestore, toast]);

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary, updateMangaDetails, isLoading }}>
      {children}
    </LibraryContext.Provider>
  );
}
