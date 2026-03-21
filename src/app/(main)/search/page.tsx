"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import type { KitsuManga } from "@/lib/kitsu-data";
import type { AniListManga } from "@/lib/anilist-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMangaLibraryId, type MangaType, type OnlineManga } from "@/lib/data";

type ApiSource = "Auto" | "Jikan" | "Kitsu" | "AniList";

const CACHE_PREFIX = "mangatrack_search_";

function normalizeMangaType(type: string | null): MangaType {
  const lowerType = type?.toLowerCase() || "";
  if (lowerType.includes("manhwa") || lowerType.includes("manhua")) return "Manhwa";
  if (lowerType.includes("manga")) return "Mangá";
  if (lowerType.includes("webtoon")) return "Webtoon";
  if (lowerType.includes("novel")) return "Novel";
  if (lowerType.includes("oel") || lowerType.includes("doujinshi")) return "Mangá";
  return "Outro";
}

function adaptJikanToOnlineManga(manga: JikanManga): OnlineManga {
  const imageUrl = manga.images.webp.large_image_url || manga.images.webp.image_url || manga.images.jpg.large_image_url || manga.images.jpg.image_url;
  const sourceId = String(manga.mal_id);

  return {
    id: createMangaLibraryId("jikan", manga.title, sourceId),
    sourceProvider: "jikan",
    sourceId,
    title: manga.title,
    type: normalizeMangaType(manga.type),
    totalChapters: manga.chapters || 0,
    status: manga.status,
    score: manga.score,
    synopsis: manga.synopsis,
    genres: manga.genres.map((genre) => genre.name),
    imageUrl,
    url: manga.url,
  };
}

function adaptKitsuToOnlineManga(manga: KitsuManga): OnlineManga {
  const imageUrl = manga.attributes.posterImage?.original || manga.attributes.posterImage?.large || manga.attributes.posterImage?.small || "";
  const sourceId = manga.id;

  return {
    id: createMangaLibraryId("kitsu", manga.attributes.canonicalTitle, sourceId),
    sourceProvider: "kitsu",
    sourceId,
    title: manga.attributes.canonicalTitle,
    type: normalizeMangaType(manga.attributes.mangaType),
    totalChapters: manga.attributes.chapterCount ?? 0,
    status: manga.attributes.status,
    score: manga.attributes.averageRating ? parseFloat(manga.attributes.averageRating) / 10 : null,
    synopsis: manga.attributes.synopsis ?? null,
    genres: [],
    imageUrl,
    url: `https://kitsu.io/manga/${manga.attributes.slug}`,
  };
}

function adaptAniListToOnlineManga(manga: AniListManga): OnlineManga {
  const imageUrl = manga.coverImage.extraLarge || manga.coverImage.large || "";
  const sourceId = String(manga.id);

  return {
    id: createMangaLibraryId("anilist", manga.title.romaji || manga.title.english || manga.title.native || "", sourceId),
    sourceProvider: "anilist",
    sourceId,
    title: manga.title.romaji || manga.title.english || manga.title.native || "",
    type: normalizeMangaType(manga.format),
    totalChapters: manga.chapters ?? 0,
    status: manga.status,
    score: manga.averageScore ? manga.averageScore / 10 : null,
    synopsis: manga.description ?? null,
    genres: manga.genres,
    imageUrl,
    url: manga.siteUrl,
  };
}

async function searchJikan(term: string, signal: AbortSignal): Promise<OnlineManga[]> {
  const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(term)}&sfw`, { signal });
  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
  }

  const data = await response.json();
  const jikanResults = (data.data || []) as JikanManga[];
  return jikanResults.map(adaptJikanToOnlineManga);
}

async function searchKitsu(term: string, signal: AbortSignal): Promise<OnlineManga[]> {
  const kitsuResponse = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(term)}`, {
    signal,
  });
  if (!kitsuResponse.ok) {
    throw new Error(`Status: ${kitsuResponse.status}`);
  }

  const kitsuData = await kitsuResponse.json();
  if (kitsuData.data && kitsuData.data.length > 0) {
    return kitsuData.data.map(adaptKitsuToOnlineManga);
  }

  return [];
}

async function searchAniList(term: string, signal: AbortSignal): Promise<OnlineManga[]> {
  const query = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: $type, sort: [SEARCH_MATCH]) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            color
          }
          format
          status
          description(asHtml: false)
          chapters
          averageScore
          genres
          siteUrl
        }
      }
    }
  `;
  const variables = {
    search: term,
    type: "MANGA",
  };

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
  }

  const data = await response.json();
  const anilistResults = (data.data?.Page?.media || []) as AniListManga[];
  return anilistResults.map(adaptAniListToOnlineManga);
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<OnlineManga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [apiSource, setApiSource] = useState<ApiSource>("Auto");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setDebouncedSearchTerm(searchTerm);
      } else {
        setDebouncedSearchTerm("");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchMangas = async () => {
      if (debouncedSearchTerm.trim().length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const normalizedTerm = debouncedSearchTerm.trim();

      const cacheKey = `${CACHE_PREFIX}${apiSource}_${normalizedTerm.toLowerCase()}`;
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          console.log("Servindo resultados do cache para:", normalizedTerm);
          startTransition(() => {
            setSearchResults(JSON.parse(cachedData));
          });
          return;
        }
      } catch (error) {
        console.warn("Não foi possível ler o cache da sessão:", error);
      }

      setIsSearching(true);
      let results: OnlineManga[] = [];
      const failedApis: string[] = [];

      const runJikanSearch = async () => {
        try {
          return await searchJikan(normalizedTerm, signal);
        } catch (error) {
          if ((error as Error).name === "AbortError") return [];
          console.warn("Jikan API request failed:", error);
          failedApis.push("Jikan");
          return [];
        }
      };

      const runKitsuSearch = async () => {
        try {
          return await searchKitsu(normalizedTerm, signal);
        } catch (error) {
          if ((error as Error).name === "AbortError") return [];
          console.warn("Kitsu API request failed:", error);
          failedApis.push("Kitsu");
          return [];
        }
      };

      const runAniListSearch = async () => {
        try {
          return await searchAniList(normalizedTerm, signal);
        } catch (error) {
          if ((error as Error).name === "AbortError") return [];
          console.warn("AniList API request failed:", error);
          failedApis.push("AniList");
          return [];
        }
      };

      if (apiSource === "Jikan") {
        results = await runJikanSearch();
      } else if (apiSource === "Kitsu") {
        results = await runKitsuSearch();
      } else if (apiSource === "AniList") {
        results = await runAniListSearch();
      } else {
        const allSearches = await Promise.allSettled([
          runJikanSearch(),
          runKitsuSearch(),
          runAniListSearch(),
        ]);

        let combinedResults: OnlineManga[] = [];
        allSearches.forEach((result) => {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            combinedResults.push(...result.value);
          }
        });

        const uniqueKeys = new Set<string>();
        results = combinedResults.filter((manga) => {
          const key = `${manga.sourceProvider}|${manga.sourceId || manga.title.toLowerCase()}|${manga.type}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            return true;
          }
          return false;
        });

        results.sort((a, b) => (b.score || 0) - (a.score || 0));
      }

      if (signal.aborted) {
        return;
      }

      if (results.length === 0) {
        let description = "Nenhum título foi encontrado com esse termo. Tente outra palavra-chave.";
        if (failedApis.length > 0) {
          description = `Provável que ${failedApis.join(", ")} esteja com problemas. Tente outra API ou palavra-chave.`;
        }
        toast({
          variant: "destructive",
          title: "Nenhum Resultado",
          description,
        });
      }

      startTransition(() => {
        if (signal.aborted) {
          return;
        }

        setSearchResults(results);
        if (results.length > 0) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(results));
          } catch (error) {
            console.warn("Não foi possível escrever no cache da sessão:", error);
          }
        }
      });

      if (signal.aborted) {
        return;
      }

      setIsSearching(false);
    };

    fetchMangas();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchTerm, toast, apiSource]);

  const isLoading = isSearching || isPending;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">Buscar Títulos Online</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar um mangá, manhwa ou webtoon..."
            className="pl-10 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={apiSource} onValueChange={(value) => setApiSource(value as ApiSource)}>
            <SelectTrigger>
              <SelectValue placeholder="Fonte da API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto">Automático</SelectItem>
              <SelectItem value="Jikan">Jikan (MAL)</SelectItem>
              <SelectItem value="Kitsu">Kitsu</SelectItem>
              <SelectItem value="AniList">AniList</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">
          {debouncedSearchTerm.trim().length >= 3
            ? `Resultados para "${debouncedSearchTerm.trim()}"`
            : "Digite ao menos 3 caracteres para buscar"}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-5 w-4/5 mt-2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {searchResults.map((manga) => (
              <OnlineMangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        ) : (
          debouncedSearchTerm.trim().length >= 3 && <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );
}
