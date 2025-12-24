
"use client";

import { useRouter } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Loader2, LogIn } from 'lucide-react';
import { signOut } from 'firebase/auth';

function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    // Redireciona para a página de login após o logout.
    router.push('/login'); 
  };

  const handleLoginRedirect = async () => {
    // Se for um usuário anônimo, faz logout primeiro para permitir o "upgrade" da conta.
    if (user && user.isAnonymous) {
      await signOut(auth);
    }
    router.push('/login');
  }

  if (isUserLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }
  
  // O usuário anônimo tem um botão de login para converter a conta.
  if (!user || user.isAnonymous) {
    return (
       <Button variant="ghost" onClick={handleLoginRedirect}>
         <LogIn className="mr-2 h-4 w-4" />
         Login
      </Button>
    )
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Minha Conta</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:justify-end">
        <div className="md:hidden">
             <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
            <ThemeToggle />
            <UserNav />
        </div>
    </header>
  );
}

    