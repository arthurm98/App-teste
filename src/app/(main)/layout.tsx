'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, BottomBar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
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
