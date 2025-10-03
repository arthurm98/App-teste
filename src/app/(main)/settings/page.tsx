import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Configurações</h1>
            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Backup e Restauração</CardTitle>
                        <CardDescription>
                            Faça backup dos dados da sua biblioteca ou restaure a partir de um backup anterior.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button>Fazer Backup</Button>
                        <Button variant="outline">Restaurar</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
