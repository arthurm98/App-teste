
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
  const items = user ? menuItems : [...menuItems, authMenuItem];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex flex-col items-center gap-0">
            <h1 className="text-xl font-headline font-semibold text-primary">MangaTrack</h1>
            <p className="text-[10px] text-muted-foreground font-sans">by ArthurM</p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {!isUserLoading && items.map((item) => (
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
