"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { mangaLibrary } from "@/lib/data"

const chartConfig = {
  count: {
    label: "Títulos",
    color: "hsl(var(--primary))",
  },
}

export function GenreChart() {
  const chartData = React.useMemo(() => {
    const genreCounts = mangaLibrary
      .flatMap((manga) => manga.genres)
      .reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
  }, [])

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{
          left: 10,
          right: 10,
        }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="genre"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
          className="text-xs"
        />
        <XAxis dataKey="count" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" layout="vertical" radius={5} fill="var(--color-count)" />
      </BarChart>
    </ChartContainer>
  )
}
