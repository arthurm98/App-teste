
import { StatsCards } from "../_components/stats-cards";
import { StatisticsCharts } from "../_components/statistics-charts";


export default function StatisticsPage() {

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-headline font-bold mb-6">Estatísticas</h1>
            
            <StatsCards />

            <StatisticsCharts />
        </div>
    );
}
