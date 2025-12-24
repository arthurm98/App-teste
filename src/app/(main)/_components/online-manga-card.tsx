"use client";

import Image from "next/image";
import { useState } from "react";
import type { JikanManga } from "@/lib/jikan-data";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";

interface OnlineMangaCardProps {
  manga: JikanManga;
}

export function OnlineMangaCard({ manga }: OnlineMangaCardProps) {
  const { addToLibrary, isMangaInLibrary } = useLibrary();
  const [isImageError, setIsImageError] = useState(false);
  // A busca por ID do Jikan/Anilist é mais confiável. Se não houver, verificamos por título (fallback para Kitsu)
  const isInLibrary = manga.mal_id ? isMangaInLibrary(manga.mal_id) : isMangaInLibrary(0, manga.title);


  const handleAdd = () => {
    if (!isInLibrary) {
        addToLibrary(manga)
    }
  }
  
  const imageUrl = manga.images.webp.large_image_url || manga.images.webp.image_url;

  return (
    <Card className="group flex flex-col overflow-hidden">
      <CardHeader className="p-0 relative">
        {imageUrl && !isImageError ? (
          <Image
            src={imageUrl}
            alt={`Capa de ${manga.title}`}
            width={400}
            height={600}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 aspect-[2/3]"
            onError={() => setIsImageError(true)}
            priority
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center p-4">
             <p className="text-center font-headline text-muted-foreground">{manga.title}</p>
          </div>
        )}
        {manga.type && <Badge variant="secondary" className="absolute top-2 left-2">{manga.type}</Badge>}
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <CardTitle className="font-headline text-base leading-tight truncate mb-2" title={manga.title}>
            {manga.title}
        </CardTitle>
        <div className="mt-auto pt-2 space-y-2">
           <div className="text-sm text-muted-foreground truncate">
            {manga.score && (
                <span>Nota: {manga.score.toFixed(2)}</span>
            )}
            {manga.score && manga.chapters ? ' • ' : ''}
            {manga.chapters && (
                <span>{manga.chapters} caps</span>
            )}
            {(!manga.score && !manga.chapters) && <span>&nbsp;</span>}
           </div>
           <Button 
             variant={isInLibrary ? "secondary" : "default"} 
             className="w-full" 
             onClick={handleAdd}
             disabled={isInLibrary}
            >
              {isInLibrary ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {isInLibrary ? 'Na Biblioteca' : 'Adicionar'}
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
