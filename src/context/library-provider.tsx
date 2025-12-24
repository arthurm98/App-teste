
"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, writeBatch, Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import { Manga, MangaStatus, MangaType } from '@/lib/data';
import { JikanManga } from '@/lib/jikan-data';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getLatestMangaInfo } from '@/services/update-manga';
import type { Notification } from '@/app/(main)/_components/notifications-log';

interface LibraryContextType {
  library: Manga[];
  addToLibrary: (manga: JikanManga) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateChapter: (mangaId: string, newChapter: number) => void;
  updateStatus: (mangaId: string, newStatus: MangaStatus) => void;
  isMangaInLibrary: (mangaId: number, title?: string) => boolean;
  restoreLibrary: (newLibrary: Manga[]) => void;
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => void;
  triggerUpdateCheck: () => void;
  isLoading: boolean;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const generateFallbackId = (title: string) => `fb-${title.toLowerCase().replace(/\s+/g, '-')}`;
const LOCAL_STORAGE_KEY = 'mangatrack-library';
const NOTIFICATIONS_KEY = 'mangatrack-notifications';
const UPDATE_INTERVAL_DAYS = 7;
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
  const [forceCheck, setForceCheck] = useState(false);


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
                const currentLatest = mangaData.latestChapter || mangaData.readChapters;
                let hasUpdate = false;
                const updates: Partial<Manga> = {};
                let notificationMessage = '';

                // Verifica se o capítulo mais recente da API é maior que o último que conhecíamos
                if (latestInfo.latestChapter && latestInfo.latestChapter > currentLatest) {
                    updates.totalChapters = Math.max(mangaData.totalChapters || 0, latestInfo.latestChapter);
                    updates.latestChapter = latestInfo.latestChapter; // Atualiza nosso conhecimento
                    hasUpdate = true;
                    notificationMessage = `Novo capítulo detectado: ${latestInfo.latestChapter}.`;
                } else if (latestInfo.totalChapters && latestInfo.totalChapters > mangaData.totalChapters) {
                    updates.totalChapters = latestInfo.totalChapters;
                    hasUpdate = true;
                    notificationMessage = `Total de capítulos atualizado para ${latestInfo.totalChapters}.`;
                }
                
                if (hasUpdate) {
                    updatesFound++;
                    updateLibraryItem(mangaData.id, updates);
                    addNotification(mangaData.title, notificationMessage);
                }
            }
        })
      );
      
      Promise.all(promises).then(() => {
        if (updatesFound > 0) {
            toast({
                title: "Novos Capítulos Encontrados",
                description: `A verificação encontrou atualizações para ${updatesFound} título(s). Confira o log de notificações.`,
            });
        }
        localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
        console.log("Verificação de atualização concluída.");
      });

  }, [updateLibraryItem, toast]);


  // Cloud library listener & weekly update
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && !user.isAnonymous && firestore) {
      setIsCloudLoading(true);
      const libCollection = collection(firestore, 'users', user.uid, 'library');
      unsubscribe = onSnapshot(libCollection, snapshot => {
        const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Manga));
        setCloudLibrary(cloudData);
        setIsCloudLoading(false);

        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        let shouldCheck = forceCheck; // Usar o estado para forçar
        if (!shouldCheck && !lastCheck) {
            shouldCheck = true; // Primeira verificação
        } else if (!shouldCheck && lastCheck) {
            const lastCheckDate = new Date(lastCheck);
            const now = new Date();
            const diffDays = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > UPDATE_INTERVAL_DAYS) {
                shouldCheck = true;
            }
        }
        
        if (shouldCheck && cloudData.length > 0) {
            const mangasToUpdate = cloudData.filter(m => m.status !== 'Completo');
            performUpdateCheck(mangasToUpdate);
            if(forceCheck) setForceCheck(false); // Reseta o gatilho
        }

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
  }, [user, firestore, toast, performUpdateCheck, forceCheck]);

  // Sync local to cloud on login
  useEffect(() => {
    if (user && !user.isAnonymous && firestore && isLocalLoaded && localLibrary.length > 0) {
      const timer = setTimeout(() => {
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
    const newManga: Manga = {
      id: mangaId,
      title: manga.title,
      type: manga.type as MangaType, // O tipo já foi normalizado na busca
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
    toast({ title: "Adicionado à Biblioteca", description: `${manga.title} foi adicionado à sua lista 'Planejo Ler'.` });
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
    
    updateLibraryItem(mangaId, updates);

    if (shouldShowCompletedToast) {
      toast({ title: "Título Concluído!", description: `Você terminou de ler ${manga.title}.` });
    }
  }, [library, toast, updateLibraryItem]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    const manga = library.find(m => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { status: newStatus };
    if (newStatus === "Completo" && manga.totalChapters > 0) {
      updates.readChapters = manga.totalChapters;
    } else if (newStatus === "Planejo Ler") {
      updates.readChapters = 0;
    }

    updateLibraryItem(mangaId, updates);
    toast({ title: "Status Atualizado", description: `O status de "${manga.title}" foi alterado para ${newStatus}.` });
  }, [library, toast, updateLibraryItem]);
  
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

     updateLibraryItem(mangaId, updates);
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
    setForceCheck(true);
  }, []);

  return (
    <LibraryContext.Provider value={{ library, addToLibrary, removeFromLibrary, updateChapter, updateStatus, isMangaInLibrary, restoreLibrary, updateMangaDetails, isLoading, triggerUpdateCheck }}>
      {children}
    </LibraryContext.Provider>
  );
}
