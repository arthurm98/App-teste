"use client";

import Image from "next/image";
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
  const isInLibrary = isMangaInLibrary(manga.mal_id);

  return (
    <Card className="group flex flex-col overflow-hidden">
      <CardHeader className="p-0 relative">
        <Image
          src={manga.images.webp.large_image_url || manga.images.webp.image_url || "/placeholder.jpg"}
          alt={`Capa de ${manga.title}`}
          width={400}
          height={600}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {manga.type && <Badge variant="secondary" className="absolute top-2 right-2">{manga.type}</Badge>}
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <CardTitle className="font-headline text-base leading-tight truncate mb-2" title={manga.title}>
            {manga.title}
        </CardTitle>
        <div className="mt-auto pt-2 space-y-2">
           <div className="text-sm text-muted-foreground">
            {manga.score && (
                <span>Nota: {manga.score.toFixed(2)}</span>
            )}
            {manga.score && manga.chapters ? ' • ' : ''}
            {manga.chapters && (
                <span>{manga.chapters} caps</span>
            )}
           </div>
           <Button 
             variant={isInLibrary ? "secondary" : "default"} 
             className="w-full" 
             onClick={() => !isInLibrary && addToLibrary(manga)}
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
