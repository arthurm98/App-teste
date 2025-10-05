
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsContent } from "../_components/settings-content";

export default function SettingsPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Configurações</h1>
            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Backup e Restauração</CardTitle>
                        <CardDescription>
                            Faça backup dos dados da sua biblioteca ou restaure a partir de um arquivo de backup anterior. O backup só funciona no modo offline.
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
