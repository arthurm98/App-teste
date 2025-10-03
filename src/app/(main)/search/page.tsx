"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { mangaLibrary } from "@/lib/data";
import { MangaCard } from "../_components/manga-card";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = mangaLibrary.filter((manga) =>
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">Buscar Títulos</h1>
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
          {searchTerm ? `Resultados para "${searchTerm}"` : "Descubra"}
        </h2>
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {searchResults.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum título encontrado.</p>
        )}
      </div>
    </div>
  );
}
