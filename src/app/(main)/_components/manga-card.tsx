"use client";

import Image from "next/image";
import { useState } from "react";
import type { Manga } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { toast } = useToast();
  const [readChapters, setReadChapters] = useState(manga.readChapters);

  const imagePlaceholder = PlaceHolderImages.find(p => p.id === manga.coverImageId);
  const progress = manga.totalChapters > 0 ? (readChapters / manga.totalChapters) * 100 : 0;

  const handleChapterChange = (amount: number) => {
    const newChapter = Math.max(0, Math.min(manga.totalChapters, readChapters + amount));
    setReadChapters(newChapter);
    if (newChapter === manga.totalChapters && manga.status !== 'Completo') {
        toast({
            title: "Título Concluído!",
            description: `Você terminou de ler ${manga.title}.`,
        });
    }
  };

  return (
    <Card className="group flex flex-col overflow-hidden">
      <CardHeader className="p-0 relative">
        <Image
          src={imagePlaceholder?.imageUrl || "https://picsum.photos/seed/placeholder/400/600"}
          alt={`Capa de ${manga.title}`}
          width={400}
          height={600}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={imagePlaceholder?.imageHint || 'manga cover'}
        />
        <Badge variant="secondary" className="absolute top-2 right-2">{manga.type}</Badge>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <CardTitle className="font-headline text-base leading-tight truncate mb-2" title={manga.title}>
            {manga.title}
        </CardTitle>
        {manga.status !== "Planejo Ler" && (
            <div className="mt-auto space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{`${readChapters} / ${manga.totalChapters}`}</span>
                </div>
                <Progress value={progress} aria-label={`${progress.toFixed(0)}% lido`} />
                <div className="flex justify-between items-center gap-2 pt-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleChapterChange(-1)} disabled={readChapters <= 0}>
                        <Minus className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleChapterChange(1)} disabled={readChapters >= manga.totalChapters}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
