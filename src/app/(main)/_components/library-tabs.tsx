
"use client";

import { useLibrary } from "@/hooks/use-library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MangaCard } from "./manga-card";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryTabs() {
  const { library, isLoading } = useLibrary();

  // A lógica de filtragem agora é baseada no `editorialStatus` para as abas principais,
  // e no `status` do usuário para a lista de planejamento.
  const emAndamento = library.filter((m) => m.editorialStatus === "Em Andamento" && m.status !== 'Planejo Ler');
  const finalizados = library.filter((m) => m.editorialStatus === "Finalizado" && m.status !== 'Planejo Ler');
  const planejoLer = library.filter((m) => m.status === "Planejo Ler");

  if (isLoading) {
    return (
      <Tabs defaultValue="emAndamento">
         <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="emAndamento">Em Andamento (0)</TabsTrigger>
          <TabsTrigger value="finalizados">Finalizados (0)</TabsTrigger>
          <TabsTrigger value="planejoLer">Planejo Ler (0)</TabsTrigger>
        </TabsList>
         <TabsContent value="emAndamento">
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
      <Tabs defaultValue="emAndamento">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="emAndamento">Em Andamento ({emAndamento.length})</TabsTrigger>
          <TabsTrigger value="finalizados">Finalizados ({finalizados.length})</TabsTrigger>
          <TabsTrigger value="planejoLer">Planejo Ler ({planejoLer.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="emAndamento">
          {emAndamento.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {emAndamento.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum título em andamento na sua biblioteca.</p>
          )}
        </TabsContent>
        <TabsContent value="finalizados">
          {finalizados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {finalizados.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum título finalizado na sua biblioteca.</p>
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
            <p className="text-muted-foreground text-center py-8">Você não planeja ler nenhum título.</p>
          )}
        </TabsContent>
      </Tabs>
  );
}
