export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon";

export type Manga = {
  id: string;
  title: string;
  type: MangaType;
  status: MangaStatus;
  coverImageId: string;
  totalChapters: number;
  readChapters: number;
  genres: string[];
  imageUrl?: string;
};

export const mangaLibrary: Manga[] = [
  {
    id: "1",
    title: "Solo Leveling",
    type: "Manhwa",
    status: "Lendo",
    coverImageId: "solo-leveling",
    totalChapters: 200,
    readChapters: 150,
    genres: ["Ação", "Fantasia", "Aventura"],
  },
  {
    id: "2",
    title: "One Piece",
    type: "Mangá",
    status: "Lendo",
    coverImageId: "one-piece",
    totalChapters: 1120,
    readChapters: 1050,
    genres: ["Ação", "Aventura", "Comédia", "Fantasia"],
  },
  {
    id: "3",
    title: "Jujutsu Kaisen",
    type: "Mangá",
    status: "Lendo",
    coverImageId: "jujutsu-kaisen",
    totalChapters: 260,
    readChapters: 258,
    genres: ["Ação", "Fantasia Sombria", "Sobrenatural"],
  },
  {
    id: "4",
    title: "Berserk",
    type: "Mangá",
    status: "Completo",
    coverImageId: "berserk",
    totalChapters: 375,
    readChapters: 375,
    genres: ["Ação", "Fantasia Sombria", "Horror"],
  },
  {
    id: "5",
    title: "Attack on Titan",
    type: "Mangá",
    status: "Completo",
    coverImageId: "attack-on-titan",
    totalChapters: 139,
    readChapters: 139,
    genres: ["Ação", "Fantasia Sombria", "Pós-apocalíptico"],
  },
  {
    id: "6",
    title: "Tower of God",
    type: "Webtoon",
    status: "Planejo Ler",
    coverImageId: "tower-of-god",
    totalChapters: 550,
    readChapters: 0,
    genres: ["Ação", "Aventura", "Fantasia"],
  },
  {
    id: "7",
    title: "Naruto",
    type: "Mangá",
    status: "Completo",
    coverImageId: "naruto",
    totalChapters: 700,
    readChapters: 700,
    genres: ["Ação", "Aventura", "Fantasia"],
  },
  {
    id: "8",
    title: "Fullmetal Alchemist",
    type: "Mangá",
    status: "Planejo Ler",
    coverImageId: "fullmetal-alchemist",
    totalChapters: 108,
    readChapters: 0,
    genres: ["Ação", "Aventura", "Fantasia", "Steampunk"],
  },
];
