"use client";

import Image from "next/image";
import type { JikanManga } from "@/lib/jikan-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OnlineMangaCardProps {
  manga: JikanManga;
}

export function OnlineMangaCard({ manga }: OnlineMangaCardProps) {
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
        <CardTitle className="font-headline text-base leading-tight truncate" title={manga.title}>
            {manga.title}
        </CardTitle>
        <div className="mt-auto pt-2">
           {manga.score && (
             <p className="text-sm text-muted-foreground">Nota: {manga.score.toFixed(2)}</p>
           )}
           {manga.chapters && (
              <p className="text-xs text-muted-foreground">{manga.chapters} capítulos</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}