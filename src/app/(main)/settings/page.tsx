"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsContent } from "../_components/settings-content";
import { MigrationContent } from "../_components/migration-content";

export default function SettingsPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Configurações</h1>
            <div className="grid gap-6 max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Migração de Dados para a Nuvem</CardTitle>
                        <CardDescription>
                            Se você usou o aplicativo sem uma conta, pode importar os dados salvos localmente para a sua conta na nuvem aqui.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MigrationContent />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Backup e Restauração (Modo Local)</CardTitle>
                        <CardDescription>
                            Faça backup da sua biblioteca local para um arquivo ou restaure-a. Esta função é destinada apenas para uso no modo offline (sem conta).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsContent />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
