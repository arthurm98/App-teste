import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

import type { Manga } from '@/lib/data';

const mangaStatusValues = ['Lendo', 'Planejo Ler', 'Completo'] as const;
const mangaTypeValues = ['Mangá', 'Manhwa', 'Webtoon', 'Novel', 'Outro'] as const;

const nonNegativeNumber = (fieldName: string) => z
  .number({
    required_error: `${fieldName} é obrigatório.`,
    invalid_type_error: `${fieldName} deve ser um número.`,
  })
  .finite(`${fieldName} deve ser um número válido.`)
  .min(0, `${fieldName} não pode ser negativo.`);

const nonEmptyString = (fieldName: string) => z
  .string({
    required_error: `${fieldName} é obrigatório.`,
    invalid_type_error: `${fieldName} deve ser um texto.`,
  })
  .trim()
  .min(1, `${fieldName} não pode estar vazio.`);

const serializedTimestampObjectSchema = z.union([
  z.object({
    seconds: z.number({ invalid_type_error: 'Timestamp.seconds deve ser um número.' }).finite(),
    nanoseconds: z.number({ invalid_type_error: 'Timestamp.nanoseconds deve ser um número.' }).finite().optional(),
  }).strict(),
  z.object({
    _seconds: z.number({ invalid_type_error: 'Timestamp._seconds deve ser um número.' }).finite(),
    _nanoseconds: z.number({ invalid_type_error: 'Timestamp._nanoseconds deve ser um número.' }).finite().optional(),
  }).strict(),
]);

const serializedTimestampSchema = z.union([
  z.string({ invalid_type_error: 'A data deve ser um texto serializado.' }),
  z.number({ invalid_type_error: 'A data deve ser um timestamp numérico.' }).finite(),
  serializedTimestampObjectSchema,
]);

const toDateFromSerializedTimestamp = (value: unknown): Date | null => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if ('seconds' in value && typeof value.seconds === 'number') {
    const nanoseconds = 'nanoseconds' in value && typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
    const date = new Date((value.seconds * 1000) + (nanoseconds / 1_000_000));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if ('_seconds' in value && typeof value._seconds === 'number') {
    const nanoseconds = '_nanoseconds' in value && typeof value._nanoseconds === 'number' ? value._nanoseconds : 0;
    const date = new Date((value._seconds * 1000) + (nanoseconds / 1_000_000));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const timestampFieldSchema = (fieldName: string) => z
  .unknown({
    required_error: `${fieldName} é obrigatório.`,
    invalid_type_error: `${fieldName} tem um formato inválido.`,
  })
  .refine((value) => serializedTimestampSchema.safeParse(value).success || value instanceof Date || value instanceof Timestamp || (!!value && typeof value === 'object' && 'toDate' in value), {
    message: `${fieldName} tem um formato inválido.`,
  })
  .transform((value, ctx) => {
    const normalizedDate = toDateFromSerializedTimestamp(value);

    if (!normalizedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${fieldName} não contém uma data válida.`,
      });
      return z.NEVER;
    }

    return Timestamp.fromDate(normalizedDate);
  });

const backupItemSchema = z.object({
  id: nonEmptyString('id'),
  title: nonEmptyString('title'),
  type: z.enum(mangaTypeValues, {
    required_error: 'type é obrigatório.',
    invalid_type_error: 'type deve ser um dos tipos suportados.',
  }),
  status: z.enum(mangaStatusValues, {
    required_error: 'status é obrigatório.',
    invalid_type_error: 'status deve ser um dos status suportados.',
  }),
  totalChapters: nonNegativeNumber('totalChapters'),
  readChapters: nonNegativeNumber('readChapters'),
  latestChapter: nonNegativeNumber('latestChapter'),
  genres: z.array(nonEmptyString('genres[]'), {
    required_error: 'genres é obrigatório.',
    invalid_type_error: 'genres deve ser uma lista de textos.',
  }),
  imageUrl: nonEmptyString('imageUrl'),
  createdAt: timestampFieldSchema('createdAt'),
  updatedAt: timestampFieldSchema('updatedAt'),
  lastUpdateCheckAt: timestampFieldSchema('lastUpdateCheckAt').optional(),
  updateFailureCount: nonNegativeNumber('updateFailureCount').optional(),
}).strict().superRefine((item, ctx) => {
  if (item.readChapters > item.totalChapters && item.totalChapters > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['readChapters'],
      message: 'readChapters não pode ser maior que totalChapters.',
    });
  }

  if (item.latestChapter < item.readChapters) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['latestChapter'],
      message: 'latestChapter não pode ser menor que readChapters.',
    });
  }
});

export const backupLibrarySchema = z.array(backupItemSchema, {
  invalid_type_error: 'O backup deve ser uma lista de itens.',
});

export type NormalizedBackupLibrary = z.infer<typeof backupLibrarySchema>;

export const normalizeBackupLibrary = (input: unknown): Manga[] => backupLibrarySchema.parse(input) as Manga[];

export const getTimestampMillis = (value: unknown): number | null => {
  const normalizedDate = toDateFromSerializedTimestamp(value);
  return normalizedDate ? normalizedDate.getTime() : null;
};

export const formatBackupValidationError = (error: z.ZodError): string => {
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return 'Arquivo de backup inválido.';
  }

  const path = firstIssue.path.reduce<string[]>((segments, segment) => {
    if (typeof segment === 'number') {
      const currentPath = segments.pop();
      segments.push(`${currentPath ?? 'item'} ${segment + 1}`);
      return segments;
    }

    segments.push(String(segment));
    return segments;
  }, []).join(' > ');

  return path ? `${path}: ${firstIssue.message}` : firstIssue.message;
};
