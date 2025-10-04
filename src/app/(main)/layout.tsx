
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, BottomBar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Book } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Book className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col w-full">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto mb-16 md:mb-0">
                {children}
            </main>
            <BottomBar />
        </div>
        <FirebaseErrorListener />
      </SidebarProvider>
  );
}
