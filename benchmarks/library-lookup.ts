
import { performance } from 'perf_hooks';

// Mocking generateFallbackId
const generateFallbackId = (title: string) => `fb-${title.toLowerCase().replace(/\s+/g, '-')}`;

interface Manga {
    id: string;
    title: string;
}

function originalLookup(library: Manga[], mangaId: number, title?: string) {
    const checkId = mangaId > 0 ? String(mangaId) : generateFallbackId(title || '');
    return library.some(m => m.id === checkId);
}

function optimizedLookup(librarySet: Set<string>, mangaId: number, title?: string) {
    const checkId = mangaId > 0 ? String(mangaId) : generateFallbackId(title || '');
    return librarySet.has(checkId);
}

// Generate data: 10,000 items in library
const library = Array.from({ length: 10000 }, (_, i) => ({
    id: String(i),
    title: `Manga ${i}`
}));

const librarySet = new Set(library.map(m => m.id));

// Test cases: some present, some not
const testCases = [
    { id: 5000, title: 'Manga 5000' }, // middle
    { id: 9999, title: 'Manga 9999' }, // end
    { id: 0, title: 'Non-existent' },   // fallback id, not present
    { id: -1, title: 'Manga 100' },     // should match fb-manga-100 if present
    { id: 15000, title: 'Out of range' }
];

// Warmup
for (let i = 0; i < 1000; i++) {
    for (const tc of testCases) {
        originalLookup(library, tc.id, tc.title);
        optimizedLookup(librarySet, tc.id, tc.title);
    }
}

const iterations = 10000;
let totalOriginal = 0;
let totalOptimized = 0;

const startOriginal = performance.now();
for (let i = 0; i < iterations; i++) {
    for (const tc of testCases) {
        originalLookup(library, tc.id, tc.title);
    }
}
const endOriginal = performance.now();
totalOriginal = endOriginal - startOriginal;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
    for (const tc of testCases) {
        optimizedLookup(librarySet, tc.id, tc.title);
    }
}
const endOptimized = performance.now();
totalOptimized = endOptimized - startOptimized;

console.log(`Results for ${iterations} iterations * ${testCases.length} lookups (Library size: 10,000):`);
console.log(`Total Original Time: ${totalOriginal.toFixed(4)}ms`);
console.log(`Total Optimized Time: ${totalOptimized.toFixed(4)}ms`);
console.log(`Average Original Time per lookup: ${(totalOriginal / (iterations * testCases.length)).toFixed(6)}ms`);
console.log(`Average Optimized Time per lookup: ${(totalOptimized / (iterations * testCases.length)).toFixed(6)}ms`);
console.log(`Improvement: ${((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2)}%`);

// Also measure Set creation time vs library size
const creationStart = performance.now();
const newSet = new Set<string>();
for (const m of library) {
    newSet.add(m.id);
}
const creationEnd = performance.now();
console.log(`Set creation time (10,000 items): ${(creationEnd - creationStart).toFixed(4)}ms`);
