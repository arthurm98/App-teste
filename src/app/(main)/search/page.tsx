
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import type { MangaDexManga, Relationship } from "@/lib/mangadex-data";
import type { KitsuManga } from "@/lib/kitsu-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApiSource = "Auto" | "Jikan" | "MangaDex" | "Kitsu";

// Função para adaptar os dados da MangaDex para o formato JikanManga
function adaptMangaDexToJikan(manga: MangaDexManga, coverUrl: string): JikanManga {
  return {
    mal_id: 0, // MangaDex não fornece mal_id diretamente, então usamos um valor placeholder
    url: `https://mangadex.org/title/${manga.id}`,
    images: {
      jpg: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
      webp: { image_url: coverUrl, small_image_url: coverUrl, large_image_url: coverUrl },
    },
    title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Untitled",
    type: manga.attributes.publicationDemographic || manga.type,
    chapters: manga.attributes.lastChapter ? parseFloat(manga.attributes.lastChapter) : null,
    status: manga.attributes.status,
    score: null, // MangaDex API não fornece score diretamente na busca
    synopsis: manga.attributes.description.en || Object.values(manga.attributes.description)[0] || null,
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
  return {
    mal_id: 0, // Kitsu não fornece mal_id
    url: `https://kitsu.io/manga/${manga.attributes.slug}`,
    images: {
      jpg: { 
        image_url: manga.attributes.posterImage?.original || "",
        small_image_url: manga.attributes.posterImage?.small || "",
        large_image_url: manga.attributes.posterImage?.large || "",
       },
      webp: { 
        image_url: manga.attributes.posterImage?.original || "",
        small_image_url: manga.attributes.posterImage?.small || "",
        large_image_url: manga.attributes.posterImage?.large || "",
       },
    },
    title: manga.attributes.canonicalTitle,
    type: manga.attributes.mangaType || "manga",
    chapters: manga.attributes.chapterCount,
    status: manga.attributes.status,
    score: manga.attributes.averageRating ? parseFloat(manga.attributes.averageRating) / 10 : null,
    synopsis: manga.attributes.synopsis,
    genres: [], // A API de busca da Kitsu não inclui gêneros
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
      
      setIsSearching(true);
      let results: JikanManga[] = [];
      let finalError = false;

      // Funções de busca por API
      const searchJikan = async () => {
        try {
          const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(debouncedSearchTerm.trim())}&sfw`);
          if (response.ok) {
            const data = await response.json();
            return data.data || [];
          }
        } catch (error) { console.warn("Jikan API request failed:", error); }
        return [];
      };

      const searchMangaDex = async () => {
        try {
            const mangaResponse = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(debouncedSearchTerm.trim())}&includes[]=cover_art`);
            if (mangaResponse.ok) {
                const mangaData = await mangaResponse.json();
                if (mangaData.data && mangaData.data.length > 0) {
                    
                    const coverArtMap = new Map<string, string>();
                    mangaData.data.forEach((item: MangaDexManga) => {
                        const coverRel = item.relationships.find(r => r.type === 'cover_art' && r.attributes?.fileName);
                        if(coverRel && coverRel.attributes?.fileName) {
                            coverArtMap.set(item.id, `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.256.jpg`);
                        }
                    });

                    return mangaData.data.map((manga: MangaDexManga) => {
                        const coverUrl = coverArtMap.get(manga.id) || "";
                        return adaptMangaDexToJikan(manga, coverUrl);
                    });
                }
            }
        } catch (error) {
            console.warn("MangaDex API request failed:", error);
        }
        return [];
      };

      const searchKitsu = async () => {
        try {
          const kitsuResponse = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(debouncedSearchTerm.trim())}`);
          if (kitsuResponse.ok) {
            const kitsuData = await kitsuResponse.json();
            if (kitsuData.data && kitsuData.data.length > 0) {
              return kitsuData.data.map(adaptKitsuToJikan);
            }
          }
        } catch (error) { console.warn("Kitsu API request failed:", error); }
        return [];
      };

      // Lógica de busca baseada na fonte da API
      if (apiSource === "Jikan") {
        results = await searchJikan();
      } else if (apiSource === "MangaDex") {
        results = await searchMangaDex();
      } else if (apiSource === "Kitsu") {
        results = await searchKitsu();
      } else { // Auto
        results = await searchJikan();
        if (results.length === 0) {
          results = await searchMangaDex();
        }
        if (results.length === 0) {
          results = await searchKitsu();
        }
      }
      
      if (results.length === 0) {
        finalError = true;
      }


      startTransition(() => {
        setSearchResults(results);
      });

      if (finalError && results.length === 0) {
         toast({
          variant: "destructive",
          title: "Erro na Busca",
          description:
            "Não foi possível buscar os mangás. Verifique o termo ou a fonte da API.",
        });
      }

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
              <OnlineMangaCard key={`${manga.mal_id || 'md'}-${index}`} manga={manga} />
            ))}
          </div>
        ) : (
          debouncedSearchTerm.trim().length >= 3 && <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );
}
