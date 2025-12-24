
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsContent } from "../_components/settings-content";
import { NotificationsLog } from "../_components/notifications-log";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Configurações</h1>
            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Backup e Restauração</CardTitle>
                        <CardDescription>
                            Faça backup dos dados da sua biblioteca ou restaure a partir de um arquivo de backup anterior. A restauração só funciona no modo offline.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsContent />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Sincronização de Capítulos</CardTitle>
                        <CardDescription>
                            O aplicativo verifica automaticamente por novos capítulos uma vez por semana. Você também pode forçar uma verificação manual para toda a sua biblioteca.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsContent showSyncOptions />
                    </CardContent>
                </Card>
                <NotificationsLog />
            </div>
        </div>
    );
}
