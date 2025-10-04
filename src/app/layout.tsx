import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { LibraryProvider } from '@/context/library-provider';
import { poppins, pt_sans } from './fonts';
import { cn } from '@/lib/utils';

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
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body className={cn("font-body antialiased", poppins.variable, pt_sans.variable)}>
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
