
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
  const [totalChapters, setTotalChapters] = useState(manga.totalChapters);

  // Garante que o estado seja atualizado se o manga prop mudar
  useEffect(() => {
    if (isOpen) {
      setTotalChapters(manga.totalChapters);
    }
  }, [isOpen, manga.totalChapters]);

  const handleSave = () => {
    const newTotalChapters = Number(totalChapters);

    if (isNaN(newTotalChapters) || newTotalChapters < 0) {
      toast({
        variant: "destructive",
        title: "Valor Inválido",
        description: "Por favor, insira um número válido para o total de capítulos.",
      });
      return;
    }
    
    if (newTotalChapters < manga.readChapters) {
       toast({
        variant: "destructive",
        title: "Valor Inválido",
        description: "O total de capítulos não pode ser menor que os capítulos já lidos.",
      });
      return;
    }

    updateMangaDetails(manga.id, { totalChapters: newTotalChapters });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Editar {manga.title}</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu título. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalChapters" className="text-right">
              Total de Capítulos
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
