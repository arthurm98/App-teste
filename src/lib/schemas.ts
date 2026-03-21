import { z } from "zod";

export const MangaStatusSchema = z.enum(["Lendo", "Planejo Ler", "Completo"]);
export const MangaTypeSchema = z.enum(["Mangá", "Manhwa", "Webtoon", "Novel", "Outro"]);

// Representação de um Timestamp do Firebase quando serializado para JSON
export const TimestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
});

export const MangaSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: MangaTypeSchema,
  status: MangaStatusSchema,
  totalChapters: z.number().int().nonnegative(),
  readChapters: z.number().int().nonnegative(),
  latestChapter: z.number().int().nonnegative(),
  genres: z.array(z.string()),
  imageUrl: z.string().url().optional().or(z.literal("")),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const BackupSchema = z.array(MangaSchema);

export type MangaBackup = z.infer<typeof BackupSchema>;
