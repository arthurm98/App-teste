'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, BottomBar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Book } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();

  // While checking auth state, show a loader.
  // This loader will show briefly for both local and cloud mode users upon first load.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Book className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // The user is either logged in or has chosen local mode. Render the app.
  return (
      <SidebarProvider>
        <div className="flex w-full">
            <AppSidebar />
            <div className="flex flex-col w-full">
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto mb-16 md:mb-0">
                    {children}
                </main>
            </div>
            <BottomBar />
        </div>
        <FirebaseErrorListener />
      </SidebarProvider>
  );
}
