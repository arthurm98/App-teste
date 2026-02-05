
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import type { KitsuManga } from "@/lib/kitsu-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApiSource = "Jikan" | "Kitsu";

const API_URLS: Record<ApiSource, string> = {
  Jikan: "https://api.jikan.moe/v4/manga",
  Kitsu: "https://kitsu.io/api/edge/manga"
};

const normalizeKitsuToJikan = (kitsuManga: KitsuManga): JikanManga => {
    let type: string;
    switch(kitsuManga.attributes.mangaType) {
        case 'manga': type = 'Mangá'; break;
        case 'manhwa': type = 'Manhwa'; break;
        case 'manhua': type = 'Manhua'; break;
        case 'novel': type = 'Novel'; break;
        case 'one_shot': type = 'One-Shot'; break;
        default: type = 'Outro';
    }

    let status: string;
    switch(kitsuManga.attributes.status) {
        case 'current': status = 'Publishing'; break;
        case 'finished': status = 'Finished'; break;
        default: status = kitsuManga.attributes.status;
    }
    
    const score = kitsuManga.attributes.averageRating ? parseFloat(kitsuManga.attributes.averageRating) / 10 : null;

    return {
        mal_id: 0, // Kitsu não fornece MAL ID, então usamos 0 para acionar o fallback por título
        title: kitsuManga.attributes.canonicalTitle,
        url: `https://kitsu.io/manga/${kitsuManga.attributes.slug}`,
        images: {
            jpg: {
                image_url: kitsuManga.attributes.posterImage?.large || "",
                small_image_url: kitsuManga.attributes.posterImage?.small || "",
                large_image_url: kitsuManga.attributes.posterImage?.large || "",
            },
            webp: {
                image_url: kitsuManga.attributes.posterImage?.large || "",
                small_image_url: kitsuManga.attributes.posterImage?.small || "",
                large_image_url: kitsuManga.attributes.posterImage?.large || "",
            },
        },
        type: type,
        chapters: kitsuManga.attributes.chapterCount,
        status: status,
        score: score,
        synopsis: kitsuManga.attributes.synopsis || null,
        genres: [], // Kitsu API não retorna gêneros na busca principal
    };
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<JikanManga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiSource, setApiSource] = useState<ApiSource>("Jikan");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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
      
      setIsSearching(true);
      
      try {
        let url = '';
        if (apiSource === 'Jikan') {
            url = `${API_URLS.Jikan}?q=${encodeURIComponent(debouncedSearchTerm)}&limit=18`;
        } else if (apiSource === 'Kitsu') {
            url = `${API_URLS.Kitsu}?filter[text]=${encodeURIComponent(debouncedSearchTerm)}&page[limit]=18`;
        }

        const response = await fetch(url, {
             headers: apiSource === 'Kitsu' ? { 'Accept': 'application/vnd.api+json' } : {}
        });

        if (!response.ok) {
            throw new Error(`A API ${apiSource} respondeu com o status: ${response.status}`);
        }
        const searchData = await response.json();
        
        startTransition(() => {
            if (apiSource === 'Jikan') {
                setSearchResults(searchData.data || []);
            } else if (apiSource === 'Kitsu') {
                const normalizedResults = (searchData.data || []).map(normalizeKitsuToJikan);
                setSearchResults(normalizedResults);
            }
        });

      } catch (error: any) {
        console.error(`${apiSource} API search failed:`, error);
        toast({
            variant: "destructive",
            title: "Erro na Busca",
            description: error.message || `Ocorreu um erro ao buscar na API ${apiSource}. Tente novamente mais tarde.`
        })
      } finally {
        setIsSearching(false);
      }
    };

    fetchMangas();
  }, [debouncedSearchTerm, toast, apiSource]);

  const isLoading = isSearching || isPending;

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">
          Buscar Títulos Online
        </h1>
      </div>
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
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Fonte:</span>
            <Select value={apiSource} onValueChange={(value) => setApiSource(value as ApiSource)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Fonte da API" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Jikan">Jikan (MyAnimeList)</SelectItem>
                    <SelectItem value="Kitsu">Kitsu.io</SelectItem>
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
