"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import type { MangaDexManga } from "@/lib/mangadex-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";

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


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<JikanManga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMangas = async () => {
      if (searchTerm.length < 3) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      let results: JikanManga[] = [];
      let errorOccurred = false;

      // 1. Tentar buscar na API Jikan
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(searchTerm)}&sfw`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            results = data.data;
          }
        } else {
           console.warn("Jikan API request failed with status:", response.status);
        }
      } catch (error) {
        console.error("Erro ao buscar na Jikan API:", error);
      }

      // 2. Se Jikan falhar ou não retornar resultados, tentar MangaDex (fallback)
      if (results.length === 0) {
        try {
          const mangaResponse = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(searchTerm)}&includes[]=cover_art`);
          if (mangaResponse.ok) {
            const mangaData = await mangaResponse.json();
            if (mangaData.data && mangaData.data.length > 0) {
                results = mangaData.data.map((manga: MangaDexManga) => {
                    const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
                    const coverFileName = coverArt?.attributes?.fileName;
                    const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg` : "/placeholder.jpg";
                    return adaptMangaDexToJikan(manga, coverUrl);
                });
            }
          } else {
             console.warn("MangaDex API request failed with status:", mangaResponse.status);
             errorOccurred = true;
          }
        } catch (error) {
          console.error("Erro ao buscar na MangaDex API:", error);
          errorOccurred = true;
        }
      }

      startTransition(() => {
        setSearchResults(results);
      });

      if (errorOccurred && results.length === 0) {
         toast({
          variant: "destructive",
          title: "Erro na Busca",
          description:
            "Não foi possível buscar os mangás. Ambas as fontes falharam.",
        });
      }

      setIsSearching(false);
    };

    const debounceTimeout = setTimeout(fetchMangas, 500); // 500ms debounce
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, toast]);

  const isLoading = isSearching || isPending;

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">
        Buscar Títulos Online
      </h1>
      <div className="relative mb-8 max-w-lg">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar um mangá, manhwa ou webtoon..."
          className="pl-10 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">
          {searchTerm.length >= 3
            ? `Resultados para "${searchTerm}"`
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
          searchTerm.length >= 3 && <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );
}
