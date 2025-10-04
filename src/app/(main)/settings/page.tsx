
"use client";

import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/use-library";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { library, restoreLibrary } = useLibrary();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        try {
            const dataStr = JSON.stringify(library, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `mangatrack_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({
                title: "Backup Concluído",
                description: "Sua biblioteca foi exportada com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao fazer backup:", error);
            toast({
                variant: "destructive",
                title: "Erro no Backup",
                description: "Não foi possível exportar sua biblioteca.",
            });
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Ocorreu um erro ao ler o arquivo.");
                }
                const restoredLibrary = JSON.parse(text);
                // Validação simples do backup
                if (Array.isArray(restoredLibrary) && restoredLibrary.every(item => 'id' in item && 'title' in item)) {
                    restoreLibrary(restoredLibrary);
                    toast({
                        title: "Restauração Concluída",
                        description: "Sua biblioteca foi restaurada com sucesso.",
                    });
                } else {
                    throw new Error("Arquivo de backup inválido.");
                }
            } catch (error: any) {
                console.error("Erro ao restaurar:", error);
                toast({
                    variant: "destructive",
                    title: "Erro na Restauração",
                    description: error.message || "Não foi possível restaurar a biblioteca a partir do arquivo.",
                });
            }
        };
        reader.readAsText(file);
        // Limpa o input para permitir o re-upload do mesmo arquivo
        event.target.value = '';
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Configurações</h1>
            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Backup e Restauração</CardTitle>
                        <CardDescription>
                            Faça backup dos dados da sua biblioteca ou restaure a partir de um arquivo de backup anterior.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button onClick={handleBackup}>Fazer Backup</Button>
                        <Button variant="outline" onClick={handleRestoreClick}>Restaurar</Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/json"
                            className="hidden"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
