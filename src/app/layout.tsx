import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { LibraryProvider } from '@/context/library-provider';
import { poppins } from './fonts';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangatrack.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'MangaTrack',
    template: `%s | MangaTrack`,
  },
  description: 'Sua biblioteca definitiva para organizar e acompanhar o progresso de leitura de mangás, manhwas, webtoons e todos os seus quadrinhos.',
  manifest: '/manifest.json',
  applicationName: 'MangaTrack',
  keywords: ['manga', 'manhwa', 'webtoon', 'quadrinhos', 'comics', 'organizador', 'tracker', 'leitor', 'biblioteca'],
  authors: [{ name: 'ArthurM', url: 'https://github.com/ArthurMaverick' }],
  creator: 'ArthurM',
  publisher: 'Firebase Studio',
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: 'MangaTrack',
    description: 'Sua biblioteca definitiva para organizar e acompanhar o progresso de leitura de mangás, manhwas, webtoons e todos os seus quadrinhos.',
    siteName: 'MangaTrack',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Logo do MangaTrack em um fundo roxo.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaTrack',
    description: 'Sua biblioteca definitiva para organizar e acompanhar o progresso de leitura de mangás, manhwas, webtoons e todos os seus quadrinhos.',
    images: [`${APP_URL}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body className={cn("font-body antialiased", poppins.variable)}>
        <ThemeProvider>
          <FirebaseClientProvider>
            <LibraryProvider>
              {children}
              <Toaster />
            </LibraryProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
