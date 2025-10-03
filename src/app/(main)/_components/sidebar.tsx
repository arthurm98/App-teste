"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Search, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  { href: "/", label: "Biblioteca", icon: Library },
  { href: "/search", label: "Busca", icon: Search },
  { href: "/statistics", label: "Estatísticas", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold text-primary">MangaTrack</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
