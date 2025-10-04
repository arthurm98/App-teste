
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, Library, Settings, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUser } from "@/firebase";

const menuItems = [
  { href: "/", label: "Biblioteca", icon: Library },
  { href: "/search", label: "Busca", icon: Search },
  { href: "/statistics", label: "Estatísticas", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const authMenuItem = { href: "/login", label: "Login", icon: LogIn };

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  // No desktop, mostramos todos os itens normais. O login é tratado no UserNav
  const itemsToDisplay = user ? menuItems : [];

  return (
    <Sidebar className="hidden md:flex md:flex-col">
      <SidebarHeader>
        <Link href="/" className="flex flex-col items-center gap-0">
            <h1 className="text-xl font-headline font-semibold text-primary">MangaTrack</h1>
            <p className="text-[10px] text-muted-foreground font-sans">by ArthurM</p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {!isUserLoading && itemsToDisplay.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}


export function BottomBar() {
    const pathname = usePathname();
    const { user } = useUser();

    if (!user) {
        return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className={cn(
                            "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                            <item.icon className={cn(
                                "w-5 h-5 mb-1",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
