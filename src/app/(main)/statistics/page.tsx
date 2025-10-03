import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreChart } from "../_components/genre-chart";
import { StatusChart } from "../_components/status-chart";
import { StatsCards } from "../_components/stats-cards";

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
