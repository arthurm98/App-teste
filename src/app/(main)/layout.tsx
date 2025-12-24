
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
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
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento do usuário terminou e não há usuário, redireciona para o login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Enquanto o estado do usuário está sendo verificado, mostramos um loader.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Book className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não houver usuário após o carregamento, não renderiza o layout principal
  // para evitar um piscar de conteúdo antes do redirecionamento.
  if (!user) {
    return null; 
  }

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

    