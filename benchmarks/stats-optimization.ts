
import { performance } from 'perf_hooks';

type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

interface Manga {
  type: MangaType;
  status: MangaStatus;
  readChapters: number;
}

function generateLibrary(count: number): Manga[] {
  const types: MangaType[] = ["Mangá", "Manhwa", "Webtoon", "Novel", "Outro"];
  const statuses: MangaStatus[] = ["Lendo", "Planejo Ler", "Completo"];
  const library: Manga[] = [];
  for (let i = 0; i < count; i++) {
    library.push({
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      readChapters: Math.floor(Math.random() * 100),
    });
  }
  return library;
}

function originalImplementation(library: Manga[]) {
    const totalTitles = library.length
    const completedTitles = library.filter(m => m.status === 'Completo').length
    const totalChaptersRead = library.reduce((acc, m) => acc + m.readChapters, 0)

    const typeCounts = library.reduce((acc, m) => {
        const type = m.type as MangaType;
        acc[type] = (acc[type] || 0) + 1
        return acc
    }, {} as Record<MangaType, number>)

    const mediaTypesString = [
        {count: typeCounts['Mangá'] || 0, label: 'Mangás'},
        {count: typeCounts['Manhwa'] || 0, label: 'Manhwas'},
        {count: typeCounts['Webtoon'] || 0, label: 'Webtoons'},
        {count: typeCounts['Novel'] || 0, label: 'Novels'},
        {count: typeCounts['Outro'] || 0, label: 'Outros'},
    ]
    .filter(item => item.count > 0)
    .map(item => `${item.count} ${item.label}`)
    .join(' • ') || 'Nenhum tipo de mídia';

    return {
        totalTitles,
        completedTitles,
        totalChaptersRead,
        mediaTypesString
    }
}

function optimizedImplementation(library: Manga[]) {
    let completedTitles = 0;
    let totalChaptersRead = 0;
    const typeCounts: Record<MangaType, number> = {
        'Mangá': 0,
        'Manhwa': 0,
        'Webtoon': 0,
        'Novel': 0,
        'Outro': 0
    };

    for (let i = 0; i < library.length; i++) {
        const m = library[i];
        if (m.status === 'Completo') {
            completedTitles++;
        }
        totalChaptersRead += m.readChapters;
        typeCounts[m.type]++;
    }

    const mediaTypes: string[] = [];
    if (typeCounts['Mangá'] > 0) mediaTypes.push(`${typeCounts['Mangá']} Mangás`);
    if (typeCounts['Manhwa'] > 0) mediaTypes.push(`${typeCounts['Manhwa']} Manhwas`);
    if (typeCounts['Webtoon'] > 0) mediaTypes.push(`${typeCounts['Webtoon']} Webtoons`);
    if (typeCounts['Novel'] > 0) mediaTypes.push(`${typeCounts['Novel']} Novels`);
    if (typeCounts['Outro'] > 0) mediaTypes.push(`${typeCounts['Outro']} Outros`);

    const mediaTypesString = mediaTypes.join(' • ') || 'Nenhum tipo de mídia';

    return {
        totalTitles: library.length,
        completedTitles,
        totalChaptersRead,
        mediaTypesString
    };
}

const librarySize = 10000;
const iterations = 1000;
const library = generateLibrary(librarySize);

console.log(`Benchmarking with library size: ${librarySize}, iterations: ${iterations}`);

// Warm up
for (let i = 0; i < 100; i++) {
    originalImplementation(library);
    optimizedImplementation(library);
}

const startOrig = performance.now();
for (let i = 0; i < iterations; i++) {
    originalImplementation(library);
}
const endOrig = performance.now();
const origTime = endOrig - startOrig;

const startOpt = performance.now();
for (let i = 0; i < iterations; i++) {
    optimizedImplementation(library);
}
const endOpt = performance.now();
const optTime = endOpt - startOpt;

console.log(`Original implementation: ${origTime.toFixed(4)}ms`);
console.log(`Optimized implementation: ${optTime.toFixed(4)}ms`);
console.log(`Improvement: ${(((origTime - optTime) / origTime) * 100).toFixed(2)}%`);

// Verification
const resOrig = originalImplementation(library);
const resOpt = optimizedImplementation(library);
if (JSON.stringify(resOrig) !== JSON.stringify(resOpt)) {
    console.error("Results don't match!");
    console.error("Original:", resOrig);
    console.error("Optimized:", resOpt);
    process.exit(1);
} else {
    console.log("Verification successful: Results match.");
}
