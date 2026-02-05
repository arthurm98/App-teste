import { Timestamp } from "firebase/firestore";

export type MangaStatus = "Lendo" | "Planejo Ler" | "Completo";
export type MangaType = "Mangá" | "Manhwa" | "Webtoon" | "Novel" | "Outro";

/**
 * @fileoverview Defines the core data structure for a library item, governed by user authority.
 *
 * HIERARCHY OF AUTHORITY (ABSOLUTE):
 * 1. User Action: The user has direct and final control.
 * 2. Library Status: The 'status' field, changed only by the user, dictates the tab.
 * 3. Progress Numbers: 'readChapters' and 'totalChapters' are user-editable data points.
 * 4. API Metadata: External data is for display only and never overrides user data.
 * 5. System Logic: The system must not infer or automate state changes.
 */
export type Manga = {
  id: string;
  title: string;
  type: MangaType;

  /**
   * Defines which library tab the work appears in ("Lendo", "Planejo Ler", "Completo").
   * This field is changed ONLY by explicit user action (e.g., a button click).
   * It is the single source of truth for tab placement.
   */
  status: MangaStatus;

  /**
   * The number of chapters the user has marked as read.
   * This value is fully editable by the user and does not affect 'status'.
   */
  readChapters: number;

  /**
   * The total number of chapters for the work, as defined by the user.
   * This is used for progress calculation but does not affect 'status'.
   */
  totalChapters: number;

  /**
   * The most recent chapter available, obtained from an API via manual sync.
   * This field is for display/informational purposes only.
   * It NEVER overrides 'totalChapters' or affects 'status'.
   */
  latestChapter: number;

  genres: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// The initial library is empty; data is loaded from cloud or localStorage.
export const mangaLibrary: Manga[] = [];
