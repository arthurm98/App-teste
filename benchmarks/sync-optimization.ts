
import { performance } from 'perf_hooks';

// Mocking Timestamp.now()
const Timestamp = {
    now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })
};

function originalSync(localLibrary: any[], cloudLibrary: any[]) {
    const start = performance.now();
    const cloudMangaIds = new Set(cloudLibrary.map(m => m.id));
    let itemsToSync = 0;
    localLibrary.forEach(localManga => {
        if (!cloudMangaIds.has(localManga.id)) {
            // Simulated doc() and batch.set() are omitted as they are constant-ish,
            // but the data preparation is what we are looking at.
            const mangaData = { ...localManga, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
            itemsToSync++;
        }
    });
    const end = performance.now();
    return end - start;
}

function optimizedSync(localLibrary: any[], cloudLibrary: any[]) {
    const start = performance.now();
    const cloudMangaIds = new Set();
    for (const m of cloudLibrary) {
        cloudMangaIds.add(m.id);
    }
    const now = Timestamp.now();
    let itemsToSync = 0;
    for (const localManga of localLibrary) {
        if (!cloudMangaIds.has(localManga.id)) {
            const mangaData = { ...localManga, createdAt: now, updatedAt: now };
            itemsToSync++;
        }
    }
    const end = performance.now();
    return end - start;
}

// Generate data: 10,000 items in local library, 5,000 in cloud.
const localLibrary = Array.from({ length: 10000 }, (_, i) => ({
    id: `manga-${i}`,
    title: `Manga ${i}`,
    status: 'Lendo',
    readChapters: 10,
    totalChapters: 20
}));
const cloudLibrary = Array.from({ length: 5000 }, (_, i) => ({
    id: `manga-${i + 7000}`,
    title: `Manga ${i + 7000}`
}));

// Warmup
for (let i = 0; i < 100; i++) {
    originalSync(localLibrary, cloudLibrary);
    optimizedSync(localLibrary, cloudLibrary);
}

const iterations = 1000;
let totalOriginal = 0;
let totalOptimized = 0;

for (let i = 0; i < iterations; i++) {
    totalOriginal += originalSync(localLibrary, cloudLibrary);
    totalOptimized += optimizedSync(localLibrary, cloudLibrary);
}

const avgOriginal = totalOriginal / iterations;
const avgOptimized = totalOptimized / iterations;

console.log(`Results for ${iterations} iterations (Local: 10k, Cloud: 5k):`);
console.log(`Average Original Time: ${avgOriginal.toFixed(4)}ms`);
console.log(`Average Optimized Time: ${avgOptimized.toFixed(4)}ms`);
console.log(`Improvement: ${((avgOriginal - avgOptimized) / avgOriginal * 100).toFixed(2)}%`);
