
"use client";

import { useRouter } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Loader2, LogIn } from 'lucide-react';
import { signOut } from 'firebase/auth';

function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    // Após o logout, o usuário permanece no app, mas em modo local.
    // A página não precisa ser recarregada, o useUser cuidará da atualização do estado.
    router.push('/'); 
  };

  if (isUserLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (!user) {
    return (
       <Button variant="ghost" onClick={() => router.push('/login')}>
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
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:justify-end">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav />
        </div>
    </header>
  );
}
