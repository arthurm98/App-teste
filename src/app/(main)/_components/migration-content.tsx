"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/use-library";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { CloudUpload } from "lucide-react";

const LOCAL_STORAGE_KEY = 'mangatrack-library';

export function MigrationContent() {
    const { syncLocalDataToCloud } = useLibrary();
    const { toast } = useToast();
    const { user } = useUser();
    const [hasLocalData, setHasLocalData] = useState(false);
    const [isMigrating, startMigration] = useTransition();

    useEffect(() => {
        // This check runs only on the client side
        if (!user) return; // Only relevant for logged-in users
        try {
            const savedLibrary = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedLibrary && JSON.parse(savedLibrary).length > 0) {
                setHasLocalData(true);
            } else {
                setHasLocalData(false);
            }
        } catch {
            setHasLocalData(false);
        }
    }, [user]);

    const handleMigration = () => {
        startMigration(async () => {
            try {
                await syncLocalDataToCloud();
                // After successful migration, the local data is cleared, so we should update the state
                setHasLocalData(false); 
            } catch (error) {
                // The error toast is already handled in the context
                console.error("Migration failed on the component side:", error);
            }
        });
    };

    if (!user || !hasLocalData) {
        return (
             <p className="text-sm text-muted-foreground">
                Nenhum dado local encontrado para migração.
            </p>
        );
    }

    return (
        <div className="flex flex-col items-start gap-4">
             <Button onClick={handleMigration} disabled={isMigrating}>
                <CloudUpload className="mr-2 h-4 w-4" />
                {isMigrating ? "Migrando Dados..." : "Migrar Dados Locais para a Nuvem"}
            </Button>
            <p className="text-sm text-muted-foreground">
                Detectamos dados de uma sessão anterior salvos neste navegador. Clique aqui para importá-los para sua conta na nuvem.
            </p>
        </div>
    );
}
