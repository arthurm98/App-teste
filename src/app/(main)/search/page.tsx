
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import type { MangaDexManga, Relationship } from "@/lib/mangadex-data";
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
import { MangaType } from "@/lib/data";

type ApiSource = "Auto" | "Jikan" | "MangaDex" | "Kitsu" | "AniList";

const CACHE_PREFIX = "mangatrack_search_";

function normalizeMangaType(type: string | null): MangaType {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('manhwa') || lowerType.includes('manhua')) return 'Manhwa';
    if (lowerType.includes('manga')) return 'Mangá';
    if (lowerType.includes('webtoon')) return 'Webtoon';
    if (lowerType.includes('novel')) return 'Novel';
    if (lowerType.includes('oel') || lowerType.includes('doujinshi')) return 'Mangá';
    return 'Outro';
}

// Função para adaptar os dados da MangaDex para o formato JikanManga
function adaptMangaDexToJikan(manga: MangaDexManga, coverUrl: string): JikanManga {
  const titleObj = manga.attributes.title;
  const mainTitle = titleObj.en || Object.values(titleObj).find(t => !!t) || "Untitled";

  const descriptionObj = manga.attributes.description;
  const synopsis = descriptionObj.en || Object.values(descriptionObj).find(d => !!d) || null;

  return {
    mal_id: 0, // MangaDex não fornece mal_id diretamente
    url: `https://mangadex.org/title/${manga.id}`,
    images: {
      jpg: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
      webp: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
    },
    title: mainTitle,
    type: normalizeMangaType(manga.attributes.publicationDemographic || manga.type),
    chapters: manga.attributes.lastChapter ? parseFloat(manga.attributes.lastChapter) : null,
    status: manga.attributes.status,
    score: null, // MangaDex API não fornece score diretamente na busca
    synopsis: synopsis,
    genres: manga.attributes.tags.filter(tag => tag.attributes.group === 'genre').map(tag => ({
      mal_id: 0,
      type: "manga",
      name: tag.attributes.name.en,
      url: ""
    })),
  };
}

// Função para adaptar os dados da Kitsu para o formato JikanManga
function adaptKitsuToJikan(manga: KitsuManga): JikanManga {
  const imageUrl = manga.attributes.posterImage?.original || "";
  return {
    mal_id: 0, // Kitsu não fornece mal_id
    url: `https://kitsu.io/manga/${manga.attributes.slug}`,
    images: {
      jpg: { 
        image_url: imageUrl,
        small_image_url: manga.attributes.posterImage?.small || "",
        large_image_url: manga.attributes.posterImage?.large || "",
       },
      webp: { 
        image_url: imageUrl,
        small_image_url: manga.attributes.posterImage?.small || "",
        large_image_url: manga.attributes.posterImage?.large || "",
       },
    },
    title: manga.attributes.canonicalTitle,
    type: normalizeMangaType(manga.attributes.mangaType),
    chapters: manga.attributes.chapterCount,
    status: manga.attributes.status,
    score: manga.attributes.averageRating ? parseFloat(manga.attributes.averageRating) / 10 : null,
    synopsis: manga.attributes.synopsis,
    genres: [], // A API de busca da Kitsu não inclui gêneros
  };
}

// Função para adaptar os dados da AniList para o formato JikanManga
function adaptAniListToJikan(manga: AniListManga): JikanManga {
    const imageUrl = manga.coverImage.extraLarge || manga.coverImage.large || "";
    return {
        mal_id: manga.id, // AniList ID pode ser usado aqui
        url: manga.siteUrl,
        images: {
            jpg: { image_url: imageUrl, small_image_url: imageUrl, large_image_url: imageUrl },
            webp: { image_url: imageUrl, small_image_url: imageUrl, large_image_url: imageUrl },
        },
        title: manga.title.romaji || manga.title.english || manga.title.native,
        type: normalizeMangaType(manga.format),
        chapters: manga.chapters,
        status: manga.status,
        score: manga.averageScore ? manga.averageScore / 10 : null, // AniList score é de 0-100
        synopsis: manga.description,
        genres: manga.genres.map(genre => ({ mal_id: 0, type: 'manga', name: genre, url: '' })),
    };
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<JikanManga[]>([]);
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
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchMangas = async () => {
      if (debouncedSearchTerm.trim().length < 3) {
        setSearchResults([]);
        return;
      }

      const cacheKey = `${CACHE_PREFIX}${apiSource}_${debouncedSearchTerm.trim().toLowerCase()}`;
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          console.log("Servindo resultados do cache para:", debouncedSearchTerm);
          startTransition(() => {
             setSearchResults(JSON.parse(cachedData));
          });
          return;
        }
      } catch (error) {
        console.warn("Não foi possível ler o cache da sessão:", error);
      }
      
      setIsSearching(true);
      let results: JikanManga[] = [];
      const failedApis: string[] = [];

      const searchJikan = async () => {
        try {
          const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(debouncedSearchTerm.trim())}&sfw`);
          if (response.ok) {
            const data = await response.json();
            const jikanResults = (data.data || []) as JikanManga[];
            return jikanResults.map(m => ({...m, type: normalizeMangaType(m.type)}));
          }
          throw new Error(`Status: ${response.status}`);
        } catch (error) { 
          console.warn("Jikan API request failed:", error);
          failedApis.push("Jikan");
        }
        return [];
      };

      const searchMangaDex = async () => {
        try {
          const baseUrl = 'https://api.mangadex.org';
          const encodedTitle = encodeURIComponent(debouncedSearchTerm.trim());
          // Construir a URL manualmente para garantir a formatação correta dos parâmetros de array
          const url = `${baseUrl}/manga?title=${encodedTitle}&limit=40&includes[]=cover_art&order[relevance]=desc`;
          
          const response = await fetch(url);
      
          if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
          }
      
          const result = await response.json();
          if (result.result !== 'ok' || !Array.isArray(result.data)) {
            return [];
          }
      
          const mangaList = result.data.filter((item: any): item is MangaDexManga => item.type === 'manga');
          
          return mangaList.map((manga: MangaDexManga) => {
            const coverRel = manga.relationships.find((rel: Relationship) => rel.type === 'cover_art');
            const coverFileName = coverRel?.attributes?.fileName; 
            const coverUrl = (coverFileName && manga.id) ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}` : "";
            return adaptMangaDexToJikan(manga, coverUrl);
          });
        } catch (error) {
          console.warn("MangaDex API request failed:", error);
          failedApis.push("MangaDex");
        }
        return [];
      };

      const searchKitsu = async () => {
        try {
          const kitsuResponse = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(debouncedSearchTerm.trim())}`);
           if (!kitsuResponse.ok) {
            throw new Error(`Status: ${kitsuResponse.status}`);
          }
            const kitsuData = await kitsuResponse.json();
            if (kitsuData.data && kitsuData.data.length > 0) {
              return kitsuData.data.map(adaptKitsuToJikan);
            }
            return [];
        } catch (error) { 
          console.warn("Kitsu API request failed:", error);
          failedApis.push("Kitsu");
        }
        return [];
      };

      const searchAniList = async () => {
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
          search: debouncedSearchTerm.trim(),
          type: 'MANGA',
        };
        try {
          const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              query,
              variables,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            const anilistResults = (data.data?.Page?.media || []) as AniListManga[];
            return anilistResults.map(adaptAniListToJikan);
          }
           throw new Error(`Status: ${response.status}`);
        } catch (error) {
          console.warn("AniList API request failed:", error);
          failedApis.push("AniList");
        }
        return [];
      };
      

      if (apiSource === "Jikan") {
        results = await searchJikan();
      } else if (apiSource === "MangaDex") {
        results = await searchMangaDex();
      } else if (apiSource === "Kitsu") {
        results = await searchKitsu();
      } else if (apiSource === "AniList") {
        results = await searchAniList();
      } else { // Auto - Busca em paralelo e agrega os resultados
        const allSearches = await Promise.allSettled([
            searchJikan(),
            searchMangaDex(),
            searchKitsu(),
            searchAniList(),
        ]);

        let combinedResults: JikanManga[] = [];
        allSearches.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                combinedResults.push(...result.value);
            }
        });

        // Remove duplicados baseando-se no título (case-insensitive)
        const uniqueTitles = new Set<string>();
        results = combinedResults.filter(manga => {
            const lowerCaseTitle = manga.title.toLowerCase();
            if (!uniqueTitles.has(lowerCaseTitle)) {
                uniqueTitles.add(lowerCaseTitle);
                return true;
            }
            return false;
        });

        // Ordena os resultados por score (se disponível), do maior para o menor
        results.sort((a, b) => (b.score || 0) - (a.score || 0));
      }
      
      if (results.length === 0) {
        let description = "Nenhum título foi encontrado com esse termo. Tente outra palavra-chave.";
        if (failedApis.length > 0) {
            description = `Provável que ${failedApis.join(", ")} esteja com problemas. Tente outra API ou palavra-chave.`
        }
        toast({
         variant: "destructive",
         title: "Nenhum Resultado",
         description: description,
       });
     }

      startTransition(() => {
        setSearchResults(results);
        if (results.length > 0) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(results));
          } catch (error) {
            console.warn("Não foi possível escrever no cache da sessão:", error);
          }
        }
      });
      setIsSearching(false);
    };

    fetchMangas();
  }, [debouncedSearchTerm, toast, apiSource]);

  const isLoading = isSearching || isPending;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">
        Buscar Títulos Online
      </h1>
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
              <SelectItem value="MangaDex">MangaDex</SelectItem>
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
            {searchResults.map((manga, index) => (
              // Usamos uma combinação do ID (se existir) e o índice como chave para evitar colisões
              <OnlineMangaCard key={`${manga.mal_id || manga.title}-${index}`} manga={manga} />
            ))}
          </div>
        ) : (
          debouncedSearchTerm.trim().length >= 3 && <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );

}
