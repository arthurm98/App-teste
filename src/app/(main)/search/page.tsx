"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JikanManga } from "@/lib/jikan-data";
import { OnlineMangaCard } from "../_components/online-manga-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<JikanManga[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      const fetchMangas = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://api.jikan.moe/v4/manga?q=${searchTerm}&sfw`
          );
          if (!response.ok) {
            throw new Error("Falha ao buscar dados.");
          }
          const data = await response.json();
          setSearchResults(data.data);
        } catch (error) {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Erro na Busca",
            description:
              "Não foi possível buscar os mangás. Tente novamente mais tarde.",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchMangas();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, toast]);

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
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {searchResults.map((manga) => (
              <OnlineMangaCard key={manga.mal_id} manga={manga} />
            ))}
          </div>
        ) : (
          searchTerm.length >= 3 && <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );
}