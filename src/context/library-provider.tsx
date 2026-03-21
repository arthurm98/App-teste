"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, writeBatch, Timestamp, Unsubscribe } from 'firebase/firestore';
import { Manga, MangaStatus, createMangaLibraryId, type OnlineManga } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getLatestMangaInfo } from '@/services/update-manga';
import type { Notification } from '@/app/(main)/_components/notifications-log';

interface LibraryLookupInput {
  sourceProvider?: Manga['sourceProvider'];
  sourceId?: string;
  title?: string;
}

interface LibraryContextType {
  library: Manga[];
  addToLibrary: (manga: OnlineManga) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateChapter: (mangaId: string, newChapter: number) => void;
  updateStatus: (mangaId: string, newStatus: MangaStatus) => void;
  isMangaInLibrary: (lookup: LibraryLookupInput) => boolean;
  restoreLibrary: (newLibrary: Manga[]) => void;
  updateMangaDetails: (mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => void;
  triggerUpdateCheck: () => void;
  isLoading: boolean;
}

export const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mangatrack-library';
const NOTIFICATIONS_KEY = 'mangatrack-notifications';
const UPDATE_INTERVAL_DAYS = 7;
const LAST_CHECK_KEY = 'mangatrack-last-check';
const UPDATE_CHECK_CONCURRENCY = 4;
const MIN_RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const addNotification = (mangaTitle: string, message: string) => {
  const newNotification: Notification = {
    id: `${mangaTitle}-${new Date().getTime()}`,
    mangaTitle,
    message,
    date: new Date().toISOString(),
  };
  try {
    const existing = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]') as Notification[];
    const updated = [newNotification, ...existing].slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Falha ao salvar notificação', e);
  }
};

const matchesLibraryEntry = (entry: Manga, lookup: LibraryLookupInput) => {
  if (lookup.sourceProvider) {
    if (entry.sourceProvider && entry.sourceProvider !== lookup.sourceProvider) {
      return false;
    }

    if (lookup.sourceId) {
      return entry.sourceId === lookup.sourceId || (lookup.sourceProvider === 'jikan' && entry.id === lookup.sourceId);
    }

    if (lookup.title) {
      const expectedId = createMangaLibraryId(lookup.sourceProvider, lookup.title);
      return entry.id === expectedId || entry.title.trim().toLowerCase() === lookup.title.trim().toLowerCase();
    }

    return false;
  }

  if (lookup.title) {
    return entry.title.trim().toLowerCase() === lookup.title.trim().toLowerCase();
  }

  return false;
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

  useEffect(() => {
    try {
      const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        setLocalLibrary(JSON.parse(savedLibrary));
      }
    } catch (error) {
      console.error('Erro ao carregar a biblioteca do localStorage', error);
    } finally {
      setIsLocalLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLocalLoaded && (!user || user.isAnonymous)) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localLibrary));
      } catch (error) {
        console.error('Erro ao salvar a biblioteca no localStorage', error);
      }
    }
  }, [localLibrary, isLocalLoaded, user]);

  const updateLibraryItem = useCallback((mangaId: string, updates: Partial<Manga>) => {
    if (user && !user.isAnonymous && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      updateDocumentNonBlocking(docRef, { ...updates, updatedAt: Timestamp.now() });
    } else {
      setLocalLibrary((prev) => prev.map((m) => (m.id === mangaId ? { ...m, ...updates, updatedAt: Timestamp.now() } : m)));
    }
  }, [user, firestore]);

  const performUpdateCheck = useCallback(async (mangasToCheck: Manga[]) => {
    const now = Date.now();
    const prioritizedMangas = mangasToCheck
      .filter((manga) => {
        const lastCheckedAt = manga.lastUpdateCheckAt?.toDate?.()?.getTime?.() ?? 0;
        return now - lastCheckedAt >= MIN_RECHECK_INTERVAL_MS;
      })
      .sort((a, b) => {
        const aPriority = a.status === 'Lendo' ? 2 : 0;
        const bPriority = b.status === 'Lendo' ? 2 : 0;
        const aGap = Math.max((a.latestChapter || a.totalChapters || 0) - (a.readChapters || 0), 0);
        const bGap = Math.max((b.latestChapter || b.totalChapters || 0) - (b.readChapters || 0), 0);
        const aScore = aPriority + (aGap <= 2 ? 1 : 0);
        const bScore = bPriority + (bGap <= 2 ? 1 : 0);
        return bScore - aScore;
      });

    console.log(`Iniciando verificação de ${prioritizedMangas.length} mangás (de ${mangasToCheck.length})...`);
    let updatesFound = 0;

    const checkMangaUpdate = async (mangaData: Manga) => {
      const checkTimestamp = Timestamp.now();
      try {
        const latestInfo = await getLatestMangaInfo(mangaData);

        if (!latestInfo) {
          updateLibraryItem(mangaData.id, {
            lastUpdateCheckAt: checkTimestamp,
            updateFailureCount: (mangaData.updateFailureCount || 0) + 1,
          });
          return;
        }

        const currentLatest = mangaData.latestChapter || mangaData.readChapters;
        let hasUpdate = false;
        const updates: Partial<Manga> = {
          lastUpdateCheckAt: checkTimestamp,
          updateFailureCount: 0,
        };
        let notificationMessage = '';

        if (latestInfo.latestChapter && latestInfo.latestChapter > currentLatest) {
          updates.totalChapters = Math.max(mangaData.totalChapters || 0, latestInfo.latestChapter);
          updates.latestChapter = latestInfo.latestChapter;
          hasUpdate = true;
          notificationMessage = `Novo capítulo detectado: ${latestInfo.latestChapter}.`;
        } else if (latestInfo.totalChapters && latestInfo.totalChapters > mangaData.totalChapters) {
          updates.totalChapters = latestInfo.totalChapters;
          hasUpdate = true;
          notificationMessage = `Total de capítulos atualizado para ${latestInfo.totalChapters}.`;
        }

        updateLibraryItem(mangaData.id, updates);
        if (hasUpdate) {
          updatesFound++;
          addNotification(mangaData.title, notificationMessage);
        }
      } catch (error) {
        console.error(`Falha ao verificar atualizações de ${mangaData.title}:`, error);
        updateLibraryItem(mangaData.id, {
          lastUpdateCheckAt: checkTimestamp,
          updateFailureCount: (mangaData.updateFailureCount || 0) + 1,
        });
      }
    };

    for (let i = 0; i < prioritizedMangas.length; i += UPDATE_CHECK_CONCURRENCY) {
      const chunk = prioritizedMangas.slice(i, i + UPDATE_CHECK_CONCURRENCY);
      await Promise.all(chunk.map(checkMangaUpdate));
    }

    if (updatesFound > 0) {
      toast({
        title: 'Novos Capítulos Encontrados',
        description: `A verificação encontrou atualizações para ${updatesFound} título(s). Confira o log de notificações.`,
      });
    }
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    console.log('Verificação de atualização concluída.');
  }, [updateLibraryItem, toast]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && !user.isAnonymous && firestore) {
      setIsCloudLoading(true);
      const libCollection = collection(firestore, 'users', user.uid, 'library');
      unsubscribe = onSnapshot(libCollection, (snapshot) => {
        const cloudData = snapshot.docs.map((docSnapshot) => ({ ...docSnapshot.data(), id: docSnapshot.id } as Manga));
        setCloudLibrary(cloudData);
        setIsCloudLoading(false);

        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        let shouldCheck = forceCheck;
        if (!shouldCheck && !lastCheck) {
          shouldCheck = true;
        } else if (!shouldCheck && lastCheck) {
          const lastCheckDate = new Date(lastCheck);
          const now = new Date();
          const diffDays = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > UPDATE_INTERVAL_DAYS) {
            shouldCheck = true;
          }
        }

        if (shouldCheck && cloudData.length > 0) {
          const mangasToUpdate = cloudData.filter((m) => m.status !== 'Completo');
          performUpdateCheck(mangasToUpdate);
          if (forceCheck) setForceCheck(false);
        }
      }, () => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: libCollection.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar dados',
          description: 'Não foi possível carregar sua biblioteca da nuvem.',
        });
        setIsCloudLoading(false);
      });
    } else {
      setCloudLibrary([]);
      setIsCloudLoading(false);
    }
    return () => unsubscribe?.();
  }, [user, firestore, toast, performUpdateCheck, forceCheck]);

  useEffect(() => {
    if (user && !user.isAnonymous && firestore && isLocalLoaded && localLibrary.length > 0) {
      const timer = setTimeout(() => {
        const syncLocalToCloud = () => {
          const batch = writeBatch(firestore);
          let itemsToSync = 0;

          localLibrary.forEach((localManga) => {
            const cloudManga = cloudLibrary.find((m) => m.id === localManga.id);
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
                title: 'Sincronização Concluída',
                description: `${itemsToSync} título(s) da sua biblioteca local foram salvos na nuvem.`,
              });
              setLocalLibrary([]);
              window.localStorage.removeItem(LOCAL_STORAGE_KEY);
            }).catch(() => {
              const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/library`,
                operation: 'write',
                requestResourceData: localLibrary,
              });
              errorEmitter.emit('permission-error', permissionError);
              toast({
                variant: 'destructive',
                title: 'Erro na Sincronização',
                description: 'Não foi possível sincronizar sua biblioteca local com a nuvem.',
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

  const isMangaInLibrary = useCallback((lookup: LibraryLookupInput) => {
    return library.some((entry) => matchesLibraryEntry(entry, lookup));
  }, [library]);

  const addToLibrary = useCallback((manga: OnlineManga) => {
    if (isMangaInLibrary({ sourceProvider: manga.sourceProvider, sourceId: manga.sourceId, title: manga.title })) {
      toast({ title: 'Já está na biblioteca', description: `${manga.title} já foi adicionado.` });
      return;
    }

    const mangaId = createMangaLibraryId(manga.sourceProvider, manga.title, manga.sourceId);
    const now = Timestamp.now();
    const newManga: Manga = {
      id: mangaId,
      sourceProvider: manga.sourceProvider,
      sourceId: manga.sourceId,
      title: manga.title,
      type: manga.type,
      status: 'Planejo Ler',
      imageUrl: manga.imageUrl,
      totalChapters: manga.totalChapters,
      readChapters: 0,
      latestChapter: manga.totalChapters,
      genres: manga.genres,
      createdAt: now,
      updatedAt: now,
    };

    if (user && !user.isAnonymous && firestore) {
      const docRef = doc(firestore, 'users', user.uid, 'library', mangaId);
      setDocumentNonBlocking(docRef, newManga, { merge: true });
    } else {
      setLocalLibrary((prev) => [...prev, newManga]);
    }
    toast({ title: 'Adicionado à Biblioteca', description: `${manga.title} foi adicionado à sua lista 'Planejo Ler'.` });
  }, [isMangaInLibrary, toast, user, firestore]);

  const removeFromLibrary = useCallback((mangaId: string) => {
    const manga = library.find((m) => m.id === mangaId);
    if (user && !user.isAnonymous && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'library', mangaId));
    } else {
      setLocalLibrary((prev) => prev.filter((m) => m.id !== mangaId));
    }
    if (manga) {
      toast({ title: 'Removido da Biblioteca', description: `${manga.title} foi removido.`, variant: 'destructive' });
    }
  }, [library, toast, user, firestore]);

  const updateChapter = useCallback((mangaId: string, newChapter: number) => {
    const manga = library.find((m) => m.id === mangaId);
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
      toast({ title: 'Título Concluído!', description: `Você terminou de ler ${manga.title}.` });
    }
  }, [library, toast, updateLibraryItem]);

  const updateStatus = useCallback((mangaId: string, newStatus: MangaStatus) => {
    const manga = library.find((m) => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { status: newStatus };
    if (newStatus === 'Completo' && manga.totalChapters > 0) {
      updates.readChapters = manga.totalChapters;
    } else if (newStatus === 'Planejo Ler') {
      updates.readChapters = 0;
    }

    updateLibraryItem(mangaId, updates);
    toast({ title: 'Status Atualizado', description: `O status de "${manga.title}" foi alterado para ${newStatus}.` });
  }, [library, toast, updateLibraryItem]);

  const updateMangaDetails = useCallback((mangaId: string, details: Partial<Pick<Manga, 'totalChapters'>>) => {
    const manga = library.find((m) => m.id === mangaId);
    if (!manga) return;

    const updates: Partial<Manga> = { ...details };

    if (details.totalChapters !== undefined && manga.readChapters > details.totalChapters) {
      updates.readChapters = details.totalChapters;
    }
    if (details.totalChapters !== undefined && manga.readChapters === details.totalChapters && manga.totalChapters > 0) {
      updates.status = 'Completo';
    }

    updateLibraryItem(mangaId, updates);
    toast({ title: 'Detalhes Atualizados', description: `As informações de "${manga.title}" foram salvas.` });
  }, [library, toast, updateLibraryItem]);

  const restoreLibrary = useCallback((newLibrary: Manga[]) => {
    if (!user || user.isAnonymous) {
      setLocalLibrary(newLibrary);
      toast({ title: 'Restauração Concluída', description: 'Sua biblioteca local foi restaurada.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Função indisponível',
        description: 'A restauração de backup não é suportada para contas logadas na nuvem.',
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
