
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const GenreChart = dynamic(() => import('../_components/genre-chart').then(mod => mod.GenreChart), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />
});
const StatusChart = dynamic(() => import('../_components/status-chart').then(mod => mod.StatusChart), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />
});
const StatsCards = dynamic(() => import('../_components/stats-cards').then(mod => mod.StatsCards), { 
    ssr: false,
    loading: () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
});

export default function StatisticsPage() {

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Estatísticas</h1>
            
            <StatsCards />

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
        </div>
    );
}
