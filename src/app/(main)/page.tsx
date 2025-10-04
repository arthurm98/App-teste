
import { LibraryTabs } from './_components/library-tabs';

export default function LibraryPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-headline font-bold mb-6">Sua Biblioteca</h1>
      <LibraryTabs />
    </div>
  );
}
