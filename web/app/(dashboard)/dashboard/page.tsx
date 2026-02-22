import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { createClient } from "@/lib/supabase-server"

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch incident counts
    const { count: totalIncidents } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })

    const { count: pendingCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente")

    const { count: inProgressCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .eq("status", "en_progreso")

    const { count: resolvedCount } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .eq("status", "resuelta")

    const { data: incidents } = await supabase
        .from("incidents")
        .select(`
            id,
            title,
            description,
            status,
            priority,
            created_at,
            updated_at,
            area:areas(name),
            room:rooms(room_code, floor),
            assignee:profiles!incidents_assigned_to_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })

    // Transform incidents data for the table
    const tableData = (incidents || []).map((incident: any, index: number) => ({
        id: index + 1,
        uuid: incident.id,
        title: incident.title || "Sin título",
        status: incident.status || "pendiente",
        priority: incident.priority || "media",
        area: incident.area?.name || "Sin área",
        room: incident.room?.room_code || "Sin habitación",
        assigned_to: incident.assignee?.full_name || "Sin asignar",
        created_at: incident.created_at || "",
    }))

    // Fetch incident trend data (grouped by day, last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: trendRaw } = await supabase
        .from("incidents")
        .select("created_at, status")
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("created_at", { ascending: true })

    // Group by date
    const trendMap = new Map<string, { created: number; resolved: number }>()
        ; (trendRaw || []).forEach((inc: any) => {
            const date = inc.created_at?.split("T")[0]
            if (!date) return
            if (!trendMap.has(date)) {
                trendMap.set(date, { created: 0, resolved: 0 })
            }
            const entry = trendMap.get(date)!
            entry.created++
            if (inc.status === "resuelta") {
                entry.resolved++
            }
        })

    const chartData = Array.from(trendMap.entries()).map(([date, val]) => ({
        date,
        created: val.created,
        resolved: val.resolved,
    }))

    const cardData = {
        total: totalIncidents || 0,
        pending: pendingCount || 0,
        inProgress: inProgressCount || 0,
        resolved: resolvedCount || 0,
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards data={cardData} />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={chartData} />
            </div>
            <DataTable data={tableData} />
        </div>
    )
}
