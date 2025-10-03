"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useLibrary } from "@/hooks/use-library"

const chartConfig = {
  Lendo: {
    label: "Lendo",
    color: "hsl(var(--chart-1))",
  },
  "Planejo Ler": {
    label: "Planejo Ler",
    color: "hsl(var(--chart-2))",
  },
  Completo: {
    label: "Completo",
    color: "hsl(var(--chart-3))",
  },
}

export function StatusChart() {
  const { library } = useLibrary();
  
  const chartData = React.useMemo(() => {
    const statusCounts = library.reduce((acc, manga) => {
      const statusKey = manga.status as keyof typeof chartConfig;
      if (chartConfig[statusKey]) {
        acc[statusKey] = (acc[statusKey] || 0) + 1;
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: chartConfig[status as keyof typeof chartConfig]?.color,
    }))
  }, [library])

  if (chartData.length === 0) {
    return <div className="flex aspect-square max-h-[300px] w-full items-center justify-center text-muted-foreground">Nenhum dado de status para exibir.</div>
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
        >
            {chartData.map((entry) => (
                <Cell key={`cell-${entry.status}`} fill={entry.fill} />
            ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
