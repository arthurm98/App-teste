
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface Notification {
    id: string;
    mangaTitle: string;
    message: string;
    date: string;
}

const NOTIFICATIONS_KEY = 'mangatrack-notifications';

export function NotificationsLog() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Garante que o código só rode no cliente para acessar o localStorage
        setIsClient(true);
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (storedNotifications) {
            setNotifications(JSON.parse(storedNotifications));
        }
    }, []);
    
    // Atualiza o estado se o localStorage mudar em outra aba
    useEffect(() => {
      if (!isClient) return;

      const handleStorageChange = () => {
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [isClient]);

    const clearAllNotifications = () => {
        localStorage.removeItem(NOTIFICATIONS_KEY);
        setNotifications([]);
    };
    
    const clearNotification = (id: string) => {
        const newNotifications = notifications.filter(n => n.id !== id);
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newNotifications));
        setNotifications(newNotifications);
    };

    if (!isClient) {
        return null; // Não renderiza nada no servidor
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span>Log de Notificações</span>
                </CardTitle>
                <CardDescription>
                    Aqui são listadas as atualizações de capítulos encontradas pela verificação automática.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {notifications.length > 0 ? (
                    <ul className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {notifications.map((notification, index) => (
                           <li key={notification.id} className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium text-sm">{notification.mangaTitle}</p>
                                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground/80">{new Date(notification.date).toLocaleString('pt-BR')}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => clearNotification(notification.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                           </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma notificação ainda.
                    </p>
                )}
            </CardContent>
            {notifications.length > 0 && (
                 <CardFooter className="border-t pt-6">
                    <Button variant="outline" onClick={clearAllNotifications}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar Todas
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
