'use client'

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { sileo } from "sileo"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Pie, PieChart } from "recharts"

export default function AnalyticsPage() {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchAnalytics = React.useCallback(async () => {
        try {
            setLoading(true)

            const { data: incidents, error } = await supabase
                .from("incidents")
                .select(`
            status,
            priority,
            created_at,
            area:areas(name)
        `)

            if (error) throw error

            // Process Trends (last 30 days)
            const trendMap = new Map<string, { created: number; resolved: number }>()
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            // Process Status count
            const statusCounts = {
                total: incidents.length,
                pending: incidents.filter(i => i.status === 'pendiente').length,
                inProgress: incidents.filter(i => i.status === 'en_progreso').length,
                resolved: incidents.filter(i => i.status === 'resuelta').length,
            }

            // Process Area distribution
            const areaMap = new Map<string, number>()
            // Process Priority distribution
            const priorityMap = new Map<string, number>()

            incidents.forEach((inc: any) => {
                const date = inc.created_at?.split("T")[0]
                if (date && new Date(date) >= thirtyDaysAgo) {
                    if (!trendMap.has(date)) trendMap.set(date, { created: 0, resolved: 0 })
                    const entry = trendMap.get(date)!
                    entry.created++
                    if (inc.status === 'resuelta') entry.resolved++
                }

                const areaName = inc.area?.name || "Sin área"
                areaMap.set(areaName, (areaMap.get(areaName) || 0) + 1)

                const priority = inc.priority || "media"
                priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1)
            })

            const chartData = Array.from(trendMap.entries())
                .map(([date, val]) => ({ date, created: val.created, resolved: val.resolved }))
                .sort((a, b) => a.date.localeCompare(b.date))

            const areaData = Array.from(areaMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)

            const priorityData = Array.from(priorityMap.entries())
                .map(([name, value]) => ({ name, value }))

            setData({
                statusCounts,
                chartData,
                areaData,
                priorityData
            })
        } catch (error: any) {
            sileo.error({ title: "Error al cargar analíticas", description: error.message })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Cargando analíticas...</p>
            </div>
        )
    }

    const PRIORITY_COLORS: Record<string, string> = {
        baja: "var(--primary)",
        media: "var(--chart-2)",
        alta: "var(--chart-3)",
        urgente: "var(--destructive)",
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 bg-background overflow-x-hidden">
            <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold">Analíticas del Hotel</h1>
                <p className="text-muted-foreground text-sm">Resumen de desempeño e incidencias.</p>
            </div>

            <SectionCards data={data.statusCounts} />

            <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={data.chartData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Incidencias por Área</CardTitle>
                        <CardDescription>Distribución de problemas por zonas del hotel.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.areaData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 12 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                        <span className="font-bold">{payload[0].payload.name}</span>: {payload[0].value}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Distribución por Prioridad</CardTitle>
                        <CardDescription>Criticidad de las incidencias reportadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0 flex items-center justify-center">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.priorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.priorityData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || 'var(--primary)'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                        <span className="font-bold capitalize">{payload[0].name}</span>: {payload[0].value}
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
                                {data.priorityData.map((entry: any) => (
                                    <div key={entry.name} className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                                        <span className="capitalize">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

