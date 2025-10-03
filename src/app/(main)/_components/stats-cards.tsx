
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, BookCheck, BookOpen, Layers3 } from "lucide-react"
import { useLibrary } from "@/hooks/use-library"

export function StatsCards() {
  const { library } = useLibrary()

  const stats = React.useMemo(() => {
    const totalTitles = library.length
    const completedTitles = library.filter(m => m.status === 'Completo').length
    const totalChaptersRead = library.reduce((acc, m) => acc + m.readChapters, 0)
    
    const typeCounts = library.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return {
        totalTitles,
        completedTitles,
        totalChaptersRead,
        mangaCount: typeCounts['Mangá'] || 0,
        manhwaCount: typeCounts['Manhwa'] || 0,
        webtoonCount: typeCounts['Webtoon'] || 0,
    }
  }, [library])

  const statItems = [
    { title: "Total de Títulos", value: stats.totalTitles, icon: Book },
    { title: "Títulos Completos", value: stats.completedTitles, icon: BookCheck },
    { title: "Capítulos Lidos", value: stats.totalChaptersRead, icon: BookOpen },
    { title: "Tipos de Mídia", value: `${stats.mangaCount} Mangás • ${stats.manhwaCount} Manhwas • ${stats.webtoonCount} Webtoons`, icon: Layers3 },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
