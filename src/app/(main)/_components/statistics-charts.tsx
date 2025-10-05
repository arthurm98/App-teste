"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

// Importando dinamicamente os gráficos com ssr: false, pois eles dependem de bibliotecas do lado do cliente.
const GenreChart = dynamic(() => import('./genre-chart').then(mod => mod.GenreChart), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />
});
const StatusChart = dynamic(() => import('./status-chart').then(mod => mod.StatusChart), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />
});

export function StatisticsCharts() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle className="font-headline">Top Gêneros</CardTitle>
                </CardHeader>
                <CardContent>
                   <GenreChart />
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusChart />
                </CardContent>
            </Card>
        </div>
    );
}
