
"use client"

import { useState, useEffect } from "react";
import { Manga } from "@/lib/data";
import { useLibrary } from "@/hooks/use-library";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EditMangaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  manga: Manga;
}

export function EditMangaDialog({ isOpen, onOpenChange, manga }: EditMangaDialogProps) {
  const { updateMangaDetails } = useLibrary();
  const { toast } = useToast();
  
  const [readChapters, setReadChapters] = useState(manga.readChapters);
  const [totalChapters, setTotalChapters] = useState(manga.totalChapters);

  useEffect(() => {
    if (isOpen) {
      setReadChapters(manga.readChapters);
      setTotalChapters(manga.totalChapters);
    }
  }, [isOpen, manga]);

  const handleSave = () => {
    const newRead = Number(readChapters);
    const newTotal = Number(totalChapters);

    if (isNaN(newRead) || isNaN(newTotal) || newRead < 0 || newTotal < 0) {
      toast({
        variant: "destructive",
        title: "Valores Inválidos",
        description: "Por favor, insira números válidos para os capítulos.",
      });
      return;
    }
    
    updateMangaDetails(manga.id, { 
      readChapters: newRead,
      totalChapters: newTotal,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar {manga.title}</DialogTitle>
          <DialogDescription>
            Altere os valores de capítulos lidos e totais.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="readChapters" className="text-right">
              Capítulos Lidos
            </Label>
            <Input
              id="readChapters"
              type="number"
              value={readChapters}
              onChange={(e) => setReadChapters(Number(e.target.value))}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalChapters" className="text-right">
              Capítulos Totais
            </Label>
            <Input
              id="totalChapters"
              type="number"
              value={totalChapters}
              onChange={(e) => setTotalChapters(Number(e.target.value))}
              className="col-span-3"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
