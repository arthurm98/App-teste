import { mangaLibrary } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MangaCard } from "./_components/manga-card";

export default function LibraryPage() {
  const reading = mangaLibrary.filter((m) => m.status === "Lendo");
  const planToRead = mangaLibrary.filter((m) => m.status === "Planejo Ler");
  const completed = mangaLibrary.filter((m) => m.status === "Completo");

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">Sua Biblioteca</h1>
      <Tabs defaultValue="reading">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="reading">Lendo</TabsTrigger>
          <TabsTrigger value="planToRead">Planejo Ler</TabsTrigger>
          <TabsTrigger value="completed">Completo</TabsTrigger>
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
