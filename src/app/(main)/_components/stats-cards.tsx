
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, BookCheck, BookOpen, Layers3 } from "lucide-react"
import { useLibrary } from "@/hooks/use-library"
import { MangaType } from "@/lib/data"

export function StatsCards() {
  const { library } = useLibrary()

  const stats = React.useMemo(() => {
    const totalTitles = library.length
    let completedTitles = 0
    let totalChaptersRead = 0
    const typeCounts: Record<MangaType, number> = {
      'Mangá': 0,
      'Manhwa': 0,
      'Webtoon': 0,
      'Novel': 0,
      'Outro': 0
    }

    for (let i = 0; i < library.length; i++) {
      const m = library[i]
      if (m.status === 'Completo') {
        completedTitles++
      }
      totalChaptersRead += m.readChapters
      typeCounts[m.type as MangaType]++
    }

    const mediaTypes: string[] = []
    if (typeCounts['Mangá'] > 0) mediaTypes.push(`${typeCounts['Mangá']} Mangás`)
    if (typeCounts['Manhwa'] > 0) mediaTypes.push(`${typeCounts['Manhwa']} Manhwas`)
    if (typeCounts['Webtoon'] > 0) mediaTypes.push(`${typeCounts['Webtoon']} Webtoons`)
    if (typeCounts['Novel'] > 0) mediaTypes.push(`${typeCounts['Novel']} Novels`)
    if (typeCounts['Outro'] > 0) mediaTypes.push(`${typeCounts['Outro']} Outros`)

    const mediaTypesString = mediaTypes.join(' • ') || 'Nenhum tipo de mídia'

    return {
      totalTitles,
      completedTitles,
      totalChaptersRead,
      mediaTypesString
    }
  }, [library])

  const statItems = [
    { title: "Total de Títulos", value: stats.totalTitles, icon: Book },
    { title: "Títulos Completos", value: stats.completedTitles, icon: BookCheck },
    { title: "Capítulos Lidos", value: stats.totalChaptersRead, icon: BookOpen },
    { title: "Tipos de Mídia", value: stats.mediaTypesString, icon: Layers3 },
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
            <div className="text-2xl font-bold truncate" title={typeof item.value === 'string' ? item.value : undefined}>
              {typeof item.value === 'number' ? item.value.toLocaleString('pt-BR') : item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
