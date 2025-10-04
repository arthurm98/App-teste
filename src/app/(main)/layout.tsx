
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Book } from 'lucide-react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento do usuário terminou e não há usuário, redirecione para o login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Enquanto o status de autenticação está carregando, mostre um indicador de loading.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Book className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se houver um usuário, mostre o conteúdo protegido.
  if (user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Retorna null ou um loader enquanto redireciona para evitar flash de conteúdo.
  return null;
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
}
