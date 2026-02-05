"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, writeBatch, Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import { Manga, MangaStatus, MangaType, EditorialStatus } from '@/lib/data';
import { JikanManga } from '@/lib/jikan-data';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getLatestMangaInfo } from '@/services/update-manga';
import type { Notification } from '@/app/(main)/_components/notifications-log';

// Estendemos o tipo esperado para incluir nosso campo normalizado
type MangaWithEditorialStatus = JikanManga & { editorialStatus: EditorialStatus };

interface LibraryContextType {
  library: Manga[];
  addToLibrary: (manga: MangaWithEditorialStatus) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateChapter: (mangaId: string, newChapter: number) => void;
  updateStatus: (mangaId: string, newStatus: MangaStatus) => void;
  isMangaInLibrary: (mangaId: number, title?: string, type?: MangaType) => boolean;
  restoreLibrary: (newLibrary: Manga[]) => void;
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'readChapters' | 'totalChapters'>>) => void;
  triggerUpdateCheck: () => void;
  isLoading: boolean;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const generateFallbackId = (title: string, type: MangaType) => `fb-${type.toLowerCase()}-${title.toLowerCase().replace(/\s+/g, '-')}`;
const LOCAL_STORAGE_KEY = 'mangatrack-library';
const NOTIFICATIONS_KEY = 'mangatrack-notifications';
const LAST_CHECK_KEY = 'mangatrack-last-check';

const addNotification = (mangaTitle: string, message: string) => {
    const newNotification: Notification = {
        id: `${mangaTitle}-${new Date().getTime()}`,
        mangaTitle,
        message,
        date: new Date().toISOString(),
    };
    try {
        const existing = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]') as Notification[];
        const updated = [newNotification, ...existing].slice(0, 50); // Limita a 50 notificações
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
        // Dispara um evento para que outros componentes (como o log) possam reagir
        window.dispatchEvent(new Event('storage'));
    } catch (e) {
        console.error("Falha ao salvar notificação", e);
    }
};

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
    if (isLocalLoaded && (!user || user.isAnonymous)) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localLibrary));
      } catch (error) {
        console.error("Erro ao salvar a biblioteca no localStorage", error);
      }
    }
  }, [localLibrary, isLocalLoaded, user]);

  const updateLibraryItem = useCallback((mangaId: string, updates: Partial<Manga>) => {
     if (user && !user.isAnonymous && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      updateDocumentNonBlocking(docRef, { ...updates, updatedAt: Timestamp.now() });
    } else {
      setLocalLibrary(prev => prev.map(m => m.id === mangaId ? { ...m, ...updates, updatedAt: Timestamp.now() } : m));
    }
  }, [user, firestore]);
  
  const performUpdateCheck = useCallback((mangasToCheck: Manga[]) => {
      console.log(`Iniciando verificação de ${mangasToCheck.length} mangás...`);
      let updatesFound = 0;

      const promises = mangasToCheck.map(mangaData => 
        getLatestMangaInfo(mangaData.id, mangaData.title).then(latestInfo => {
            if (latestInfo) {
                // USER DATA WINS: A verificação da API só atualiza o `latestChapter`.
                // NUNCA deve alterar status, readChapters ou totalChapters.
                const apiLatestChapter = latestInfo.latestChapter || latestInfo.totalChapters;
                
                if (apiLatestChapter && apiLatestChapter > mangaData.latestChapter) {
                    updatesFound++;
                    updateLibraryItem(mangaData.id, { latestChapter: apiLatestChapter });
                    addNotification(mangaData.title, `Novo capítulo detectado: ${apiLatestChapter}.`);
                }
            }
        })
      );
      
      Promise.all(promises).then(() => {
        console.log("Verificação de atualização concluída.");
        if (updatesFound > 0) {
            toast({
                title: "Novos Capítulos Encontrados",
                description: `A verificação encontrou atualizações para ${updatesFound} título(s). Confira o log de notificações.`,
            });
        } else {
             toast({
                title: "Nenhuma atualização encontrada",
                description: "Sua biblioteca está em dia. Nenhum capítulo novo foi encontrado.",
            });
        }
      });

  }, [updateLibraryItem, toast]);

  // Cloud library listener
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && !user.isAnonymous && firestore) {
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
    if (user && !user.isAnonymous && firestore && isLocalLoaded && localLibrary.length > 0) {
      const timer = setTimeout(() => {
        const syncLocalToCloud = () => {
          const batch = writeBatch(firestore);
          let itemsToSync = 0;
          
          localLibrary.forEach(localManga => {
            const cloudManga = cloudLibrary.find(m => m.id === localManga.id || (m.title === localManga.title && m.type === localManga.type));
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
          } else if (localLibrary.length > 0) {
            setLocalLibrary([]);
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        };
        syncLocalToCloud();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, firestore, isLocalLoaded, localLibrary, cloudLibrary, toast]);

  const library = useMemo(() => (!user || user.isAnonymous ? localLibrary : cloudLibrary), [user, cloudLibrary, localLibrary]);
  const isLoading = useMemo(() => isUserLoading || (!user ? !isLocalLoaded : isCloudLoading), [user, isUserLoading, isCloudLoading, isLocalLoaded]);


  const isMangaInLibrary = useCallback((mangaId: number, title: string, type: MangaType) => {
    const normalizedTitle = title.trim().toLowerCase();
    return library.some(m => 
        (m.id === String(mangaId) && mangaId > 0) ||
        (m.title.trim().toLowerCase() === normalizedTitle && m.type === type)
    );
  }, [library]);

  const addToLibrary = useCallback((manga: MangaWithEditorialStatus) => {
    const mangaType = manga.type as MangaType;

    if (isMangaInLibrary(manga.mal_id, manga.title, mangaType)) {
      toast({ title: "Já está na biblioteca", description: `${manga.title} (${mangaType}) já foi adicionado.` });
      return;
    }
    
    const mangaId = manga.mal_id > 0 ? String(manga.mal_id) : generateFallbackId(manga.title, mangaType);
    const now = Timestamp.now();
    const newManga: Manga = {
      id: mangaId,
      title: manga.title,
      type: mangaType,
      editorialStatus: manga.editorialStatus,
      status: "Planejo Ler",
      imageUrl: manga.images.webp.large_image_url || manga.images.webp.image_url,
      totalChapters: manga.chapters || 0,
      readChapters: 0,
      latestChapter: manga.chapters || 0,
      genres: manga.genres.map(g => g.name),
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isAnonymous && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      setDocumentNonBlocking(docRef, newManga, { merge: true });
    } else {
      setLocalLibrary(prev => [...prev, newManga]);
    }
    toast({ title: "Adicionado à Biblioteca", description: `${manga.title} (${mangaType}) foi adicionado à sua lista 'Planejo Ler'.` });
  }, [isMangaInLibrary, toast, user, firestore]);

  const removeFromLibrary = useCallback((mangaId: string) => {
    const manga = library.find(m => m.id === mangaId);
    if (user && !user.isAnonymous && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'library', mangaId));
    } else {
      setLocalLibrary(prev => prev.filter(m => m.id !== mangaId));
    }
    if (manga) {
      toast({ title: "Removido da Biblioteca", description: `${manga.title} foi removido.`, variant: "destructive" });
    }
  }, [library, toast, user, firestore]);

  const updateChapter = useCallback((mangaId: string, newChapter: number) => {
    // Esta função agora APENAS atualiza o número de capítulos lidos.
    // Nenhuma outra lógica ou mudança de status é inferida.
    const newRead = Math.max(0, newChapter);
    updateLibraryItem(mangaId, { readChapters: newRead });
  }, [updateLibraryItem]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    // Esta é a única função que pode mudar a aba (status) de uma obra.
    // É uma ação manual e explícita do usuário.
    const manga = library.find(m => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { status: newStatus };
    
    // Pequenos atalhos de UX como conveniência, mas a ação principal é manual.
    if (newStatus === "Completo" && manga.totalChapters > 0) {
      updates.readChapters = manga.totalChapters;
    } else if (newStatus === "Planejo Ler") {
      updates.readChapters = 0;
    } else if (newStatus === "Lendo" && manga.readChapters === 0) {
      updates.readChapters = 1;
    }

    updateLibraryItem(mangaId, updates);
    toast({ title: "Status Atualizado", description: `O status de "${manga.title}" foi alterado para ${newStatus}.` });
  }, [library, toast, updateLibraryItem]);
  
  const updateMangaDetails = useCallback((mangaId: string, details: Partial<Pick<Manga, 'readChapters' | 'totalChapters'>>) => {
     // Esta função salva os detalhes editados pelo usuário, sem inferir status.
     const manga = library.find(m => m.id === mangaId);
     if (!manga) return;
     
     updateLibraryItem(mangaId, details);
     toast({ title: "Detalhes Atualizados", description: `As informações de "${manga.title}" foram salvas.` });
  }, [library, toast, updateLibraryItem]);

  const restoreLibrary = useCallback((newLibrary: Manga[]) => {
    if (!user || user.isAnonymous) {
       setLocalLibrary(newLibrary);
       toast({ title: "Restauração Concluída", description: "Sua biblioteca local foi restaurada." });
    } else {
       toast({
        variant: "destructive",
        title: "Função indisponível",
        description: "A restauração de backup não é suportada para contas logadas na nuvem.",
      });
    }
  }, [user, toast]);

    const triggerUpdateCheck = useCallback(() => {
        if (library.length > 0) {
            performUpdateCheck(library);
        } else {
            toast({
                title: "Nenhuma obra para verificar",
                description: "Sua biblioteca está vazia.",
            });
        }
    }, [library, performUpdateCheck, toast]);

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary, updateMangaDetails, isLoading, triggerUpdateCheck }}>
      {children}
    </LibraryContext.Provider>
  );
}
