"use client";

import { useLibrary } from "@/hooks/use-library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MangaCard } from "./manga-card";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryTabs() {
  const { library, isLoading } = useLibrary();

  // 1. Completas: Obras finalizadas pela editora E que o usuário leu todos os capítulos.
  const completas = library.filter(m => 
    m.editorialStatus === 'Finalizado' && 
    m.totalChapters > 0 && 
    m.readChapters === m.totalChapters
  );

  // 2. Planejo Ler: Obras que o usuário não começou a ler.
  const planejoLer = library.filter((m) => m.readChapters === 0);

  // 3. Lendo: Todas as outras obras que o usuário já começou, mas que não estão na lista de completas.
  // Isso inclui obras "em dia" de séries em andamento.
  const lendo = library.filter(m => 
    m.readChapters > 0 && 
    !completas.some(c => c.id === m.id)
  );

  if (isLoading) {
    return (
      <Tabs defaultValue="lendo">
         <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="lendo">Lendo (0)</TabsTrigger>
          <TabsTrigger value="completas">Completas (0)</TabsTrigger>
          <TabsTrigger value="planejoLer">Planejo Ler (0)</TabsTrigger>
        </TabsList>
         <TabsContent value="lendo">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="flex flex-col gap-2">
                 <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                 <Skeleton className="h-5 w-4/5 mt-2" />
                 <Skeleton className="h-10 w-full mt-2" />
               </div>
             ))}
           </div>
         </TabsContent>
      </Tabs>
    );
  }

  return (
      <Tabs defaultValue="lendo">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="lendo">Lendo ({lendo.length})</TabsTrigger>
          <TabsTrigger value="completas">Completas ({completas.length})</TabsTrigger>
          <TabsTrigger value="planejoLer">Planejo Ler ({planejoLer.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="lendo">
          {lendo.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {lendo.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum título sendo lido no momento.</p>
          )}
        </TabsContent>
        <TabsContent value="completas">
          {completas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {completas.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma obra completa na sua biblioteca.</p>
          )}
        </TabsContent>
        <TabsContent value="planejoLer">
          {planejoLer.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {planejoLer.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum título na sua lista de planejamento.</p>
          )}
        </TabsContent>
      </Tabs>
  );
}
