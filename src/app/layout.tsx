import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { LibraryProvider } from '@/context/library-provider';

export const metadata: Metadata = {
  title: 'MangaTrack',
  description: 'Organize e acompanhe seus mangás, manhwas e webtoons.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <LibraryProvider>
            {children}
            <Toaster />
          </LibraryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
