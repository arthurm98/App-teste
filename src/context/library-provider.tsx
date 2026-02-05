
"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, writeBatch, Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import { Manga, MangaStatus, MangaType, PublicationStatus } from '@/lib/data';
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
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'readChapters' | 'totalChapters'>>) => void;
  isLoading: boolean;
  syncLocalDataToCloud: () => Promise<void>;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const generateFallbackId = (title: string) => `fb-${title.toLowerCase().replace(/\s+/g, '-')}`;
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
        const parsedLibrary: any[] = JSON.parse(savedLibrary);
        // Data migration for older versions and ensure Timestamps are correct
        const migratedLibrary = parsedLibrary.map(m => {
           const createdAt = m.createdAt?.seconds ? new Timestamp(m.createdAt.seconds, m.createdAt.nanoseconds) : Timestamp.now();
           const updatedAt = m.updatedAt?.seconds ? new Timestamp(m.updatedAt.seconds, m.updatedAt.nanoseconds) : Timestamp.now();
           return {
                ...m,
                publicationStatus: m.publicationStatus || 'Unknown',
                createdAt,
                updatedAt
           }
        });
        setLocalLibrary(migratedLibrary);
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
        const cloudData = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                ...data, 
                id: doc.id,
                publicationStatus: data.publicationStatus || 'Unknown' // Add default
            } as Manga
        });
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

  const syncLocalDataToCloud = useCallback(async () => {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para sincronizar dados com a nuvem.",
        });
        throw new Error("User not logged in");
    }

    try {
        const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedLibrary) {
            toast({
                title: "Nenhum Dado Local",
                description: "Não há dados na biblioteca local para migrar.",
            });
            return;
        }
        
        const localData: any[] = JSON.parse(savedLibrary);
        if (localData.length === 0) {
             toast({
                title: "Nenhum Dado Local",
                description: "A biblioteca local está vazia.",
            });
            return;
        }

        const batch = writeBatch(firestore);
        let itemsToSync = 0;

        localData.forEach(localManga => {
            const cloudManga = cloudLibrary.find(m => m.id === localManga.id);
            if (!cloudManga) {
                const docRef = doc(firestore, 'users', user.uid, 'library', localManga.id);
                const createdAt = localManga.createdAt?.seconds ? new Timestamp(localManga.createdAt.seconds, localManga.createdAt.nanoseconds) : Timestamp.now();
                const mangaData = { 
                    ...localManga,
                    publicationStatus: localManga.publicationStatus || 'Unknown',
                    createdAt: createdAt,
                    updatedAt: Timestamp.now() 
                };
                batch.set(docRef, mangaData);
                itemsToSync++;
            }
        });

        if (itemsToSync > 0) {
            await batch.commit();
            toast({
                title: "Migração Concluída",
                description: `${itemsToSync} título(s) foram migrados da sua biblioteca local para a nuvem.`,
            });
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        } else {
            toast({
                title: "Nenhum Item Novo",
                description: "Todos os seus títulos locais já estão na nuvem.",
            });
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Erro na migração de dados:", error);
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/library`,
            operation: 'write',
            requestResourceData: 'Multiple items from local storage',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Erro na Migração",
            description: "Não foi possível migrar sua biblioteca local para a nuvem.",
        });
        throw error;
    }
  }, [user, firestore, cloudLibrary, toast]);


  const library = useMemo(() => (!user ? localLibrary : cloudLibrary), [user, cloudLibrary, localLibrary]);
  const isLoading = useMemo(() => isUserLoading || (!user ? !isLocalLoaded : isCloudLoading), [user, isUserLoading, isCloudLoading, isLocalLoaded]);

  const isMangaInLibrary = useCallback((mangaId: number, title?: string) => {
    const checkId = mangaId > 0 ? String(mangaId) : generateFallbackId(title || '');
    return library.some(m => m.id === checkId);
  }, [library]);

  const addToLibrary = useCallback((manga: JikanManga) => {
    if (isMangaInLibrary(manga.mal_id, manga.title)) {
      toast({ title: "Já está na biblioteca", description: `${manga.title} já foi adicionado.` });
      return;
    }
    
    const mangaId = manga.mal_id > 0 ? String(manga.mal_id) : generateFallbackId(manga.title);
    const now = Timestamp.now();

    let publicationStatus: PublicationStatus = "Unknown";
    if (manga.status === "Finished") {
        publicationStatus = "Finished";
    } else if (manga.status === "Publishing" || manga.status === "On Hiatus") {
        publicationStatus = "Publishing";
    }

    const newManga: Manga = {
      id: mangaId,
      title: manga.title,
      type: (manga.type || "Outro") as MangaType,
      status: "Planejo Ler",
      publicationStatus: publicationStatus,
      imageUrl: manga.images.webp.large_image_url || manga.images.webp.image_url,
      totalChapters: manga.chapters || 0,
      readChapters: 0,
      genres: manga.genres.map(g => g.name),
      createdAt: now,
      updatedAt: now,
    };

    if (user && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      setDocumentNonBlocking(docRef, newManga, { merge: true });
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

  const updateChapter = useCallback((mangaId: string, newChapter: number) => {
    const updates: Partial<Manga> = { readChapters: newChapter, updatedAt: Timestamp.now() };
    if (user && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      updateDocumentNonBlocking(docRef, updates);
    } else {
      setLocalLibrary(prev => prev.map(m => m.id === mangaId ? { ...m, ...updates } : m));
    }
  }, [user, firestore]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    const manga = library.find(m => m.id === mangaId);
    if (!manga) return;
    const updates: Partial<Manga> = { status: newStatus, updatedAt: Timestamp.now() };
    if (user && firestore) {
        const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
        updateDocumentNonBlocking(docRef, updates);
    } else {
        setLocalLibrary(prev => prev.map(m => m.id === mangaId ? { ...m, ...updates } : m));
    }
    toast({ title: "Status Atualizado", description: `O status de "${manga.title}" foi alterado para ${newStatus}.` });
  }, [library, toast, user, firestore]);
  
  const updateMangaDetails = useCallback((mangaId: string, details: Partial<Pick<Manga, 'readChapters' | 'totalChapters'>>) => {
     const manga = library.find(m => m.id === mangaId);
     if (!manga) return;
     const updates = { ...details, updatedAt: Timestamp.now() };
     if (user && firestore) {
        const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
        updateDocumentNonBlocking(docRef, updates);
     } else {
        setLocalLibrary(prev => prev.map(m => m.id === mangaId ? { ...m, ...updates } : m));
     }
     toast({ title: "Detalhes Atualizados", description: `As informações de "${manga.title}" foram salvas.` });
  }, [library, toast, user, firestore]);

  const restoreLibrary = useCallback((newLibrary: Manga[]) => {
    if (!user) {
       const migratedLibrary = newLibrary.map(m => {
           const createdAt = m.createdAt?.seconds ? new Timestamp(m.createdAt.seconds, m.createdAt.nanoseconds) : Timestamp.now();
           const updatedAt = m.updatedAt?.seconds ? new Timestamp(m.updatedAt.seconds, m.updatedAt.nanoseconds) : Timestamp.now();
            return { ...m, createdAt, updatedAt };
       });
       setLocalLibrary(migratedLibrary);
       toast({ title: "Restauração Concluída", description: "Sua biblioteca local foi restaurada." });
    } else {
       toast({
        variant: "destructive",
        title: "Função indisponível",
        description: "A restauração de backup não é suportada para contas logadas na nuvem.",
      });
    }
  }, [user, toast]);

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary, updateMangaDetails, isLoading, syncLocalDataToCloud }}>
      {children}
    </LibraryContext.Provider>
  );
}
