
"use client";

import { useLibrary } from "@/hooks/use-library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MangaCard } from "./_components/manga-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryPage() {
  const { library, isLoading } = useLibrary();

  const reading = library.filter((m) => m.status === "Lendo");
  const planToRead = library.filter((m) => m.status === "Planejo Ler");
  const completed = library.filter((m) => m.status === "Completo");

  if (isLoading) {
    return (
      <div className="container mx-auto">
         <h1 className="text-3xl font-headline font-bold mb-6">Sua Biblioteca</h1>
         <Tabs defaultValue="reading">
           <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
            <TabsTrigger value="reading">Lendo (0)</TabsTrigger>
            <TabsTrigger value="planToRead">Planejo Ler (0)</TabsTrigger>
            <TabsTrigger value="completed">Completo (0)</TabsTrigger>
          </TabsList>
           <TabsContent value="reading">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
               {Array.from({ length: 6 }).map((_, i) => (
                 <div key={i} className="flex flex-col gap-2">
                   <Skeleton className="h-[300px] w-full" />
                   <Skeleton className="h-5 w-4/5 mt-2" />
                   <Skeleton className="h-10 w-full mt-2" />
                 </div>
               ))}
             </div>
           </TabsContent>
         </Tabs>
      </div>
    );
  }


  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">Sua Biblioteca</h1>
      <Tabs defaultValue="reading">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="reading">Lendo ({reading.length})</TabsTrigger>
          <TabsTrigger value="planToRead">Planejo Ler ({planToRead.length})</TabsTrigger>
          <TabsTrigger value="completed">Completo ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="reading">
          {reading.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {reading.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum título na sua lista de leitura.</p>
          )}
        </TabsContent>
        <TabsContent value="planToRead">
          {planToRead.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {planToRead.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Você não planeja ler nenhum título.</p>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {completed.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {completed.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Você ainda não completou nenhum título.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
