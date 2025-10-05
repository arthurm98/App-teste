"use client";

import Image from "next/image";
import { useState } from "react";
import type { Manga, MangaStatus } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Check, BookOpen, Clock, MoreVertical, Pencil } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EditMangaDialog } from "./edit-manga-dialog";


interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { updateChapter, removeFromLibrary, updateStatus } = useLibrary();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  const imageUrl = manga.imageUrl || "https://picsum.photos/seed/placeholder/400/600";
  const progress = manga.totalChapters > 0 ? (manga.readChapters / manga.totalChapters) * 100 : 0;

  const handleChapterChange = (amount: number) => {
    const newChapter = Math.max(0, Math.min(manga.totalChapters, manga.readChapters + amount));
    updateChapter(manga.id, newChapter);
  };
  
  const handleStatusChange = (status: MangaStatus) => {
    updateStatus(manga.id, status);
  }

  return (
    <>
      <Card className="group flex flex-col overflow-hidden">
        <CardHeader className="p-0 relative">
          {isImageError ? (
             <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center p-4">
                <p className="text-center font-headline text-muted-foreground">{manga.title}</p>
             </div>
          ) : (
            <Image
              src={imageUrl}
              alt={`Capa de ${manga.title}`}
              width={400}
              height={600}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={'manga cover'}
              onError={() => setIsImageError(true)}
              priority={false} // Imagens da biblioteca não são prioridade
            />
          )}
          <Badge variant="secondary" className="absolute top-2 left-2">{manga.type}</Badge>
          <div className="absolute top-1 right-1">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/60 hover:bg-background/90">
                          <MoreVertical className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange("Lendo")} disabled={manga.status === 'Lendo'}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>Marcar como "Lendo"</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange("Planejo Ler")} disabled={manga.status === 'Planejo Ler'}>
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Marcar como "Planejo Ler"</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange("Completo")} disabled={manga.status === 'Completo'}>
                          <Check className="mr-2 h-4 w-4" />
                          <span>Marcar como "Completo"</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => removeFromLibrary(manga.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remover</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 flex-grow flex flex-col">
          <CardTitle className="font-headline text-base leading-tight truncate mb-2" title={manga.title}>
              {manga.title}
          </CardTitle>
          {manga.status !== "Planejo Ler" && manga.totalChapters > 0 && (
              <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Progresso ({progress.toFixed(0)}%)</span>
                      <span>{`${manga.readChapters} / ${manga.totalChapters}`}</span>
                  </div>
                  <Progress value={progress} aria-label={`${progress.toFixed(0)}% lido`} />
                  <div className="flex justify-between items-center gap-2 pt-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleChapterChange(-1)} disabled={manga.readChapters <= 0}>
                          <Minus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleChapterChange(1)} disabled={manga.readChapters >= manga.totalChapters}>
                          <Plus className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
          )}
           {manga.status !== "Planejo Ler" && manga.totalChapters === 0 && (
               <div className="flex-grow flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Caps.
                    </Button>
               </div>
           )}
          {manga.status === "Planejo Ler" && (
              <div className="mt-auto">
                  <Button variant="secondary" className="w-full" onClick={() => handleStatusChange("Lendo")}>
                      <Plus className="mr-2 h-4 w-4" /> Começar a Ler
                  </Button>
              </div>
          )}
        </CardContent>
      </Card>
      <EditMangaDialog 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        manga={manga}
      />
    </>
  );
}
