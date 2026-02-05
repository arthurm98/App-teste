
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchManga } from "@/ai/flows/search-manga-flow";


const CACHE_PREFIX = "mangatrack_ai_search_";

// Helper to adapt AI output to JikanManga type if needed, though they should be compatible
function adaptAiResultToJikan(aiResult: any): JikanManga {
  return {
    ...aiResult,
    images: {
      ...aiResult.images,
      jpg: { // Ensure jpg property exists for compatibility
        image_url: aiResult.images.webp.image_url,
        small_image_url: aiResult.images.webp.image_url,
        large_image_url: aiResult.images.webp.large_image_url,
      }
    }
  };
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<JikanManga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

      const cacheKey = `${CACHE_PREFIX}${debouncedSearchTerm.trim().toLowerCase()}`;
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
      
      try {
        const aiResponse = await searchManga(debouncedSearchTerm.trim());
        const results = aiResponse.results.map(adaptAiResultToJikan);

        if (results.length === 0) {
            toast({
             variant: "destructive",
             title: "Nenhum Resultado",
             description: "A busca com IA não encontrou títulos com esse termo. Tente outra palavra-chave.",
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

      } catch (error) {
        console.error("AI search flow failed:", error);
        toast({
            variant: "destructive",
            title: "Erro na Busca",
            description: "Ocorreu um erro ao usar a busca com IA. Por favor, tente novamente."
        })
      } finally {
        setIsSearching(false);
      }
    };

    fetchMangas();
  }, [debouncedSearchTerm, toast]);

  const isLoading = isSearching || isPending;

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">
          Buscar Títulos Online
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 sm:mt-0">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span>Busca com Inteligência Artificial</span>
        </div>
      </div>
      <div className="flex gap-4 mb-8">
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
