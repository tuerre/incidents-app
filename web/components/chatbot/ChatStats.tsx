'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, CheckCircle, Clock, BarChart2, MessageSquareText } from 'lucide-react'

interface Props {
    onQuickQuestion: (q: string) => void
}

interface Stats {
    urgentes: number
    abiertas: number
    resueltas_hoy: number
    en_progreso: number
}

export default function ChatStats({ onQuickQuestion }: Props) {
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const hoy = new Date().toISOString().split('T')[0]

            const [urgentes, abiertas, resueltas, en_progreso] = await Promise.all([
                supabase.from('incidents').select('*', { count: 'exact', head: true })
                    .eq('priority', 'alta').eq('status', 'pendiente'),
                supabase.from('incidents').select('*', { count: 'exact', head: true })
                    .eq('status', 'pendiente'),
                supabase.from('incidents').select('*', { count: 'exact', head: true })
                    .eq('status', 'resuelta').gte('updated_at', hoy),
                supabase.from('incidents').select('*', { count: 'exact', head: true })
                    .eq('status', 'en_progreso'),
            ])

            setStats({
                urgentes: urgentes.count ?? 0,
                abiertas: abiertas.count ?? 0,
                resueltas_hoy: resueltas.count ?? 0,
                en_progreso: en_progreso.count ?? 0,
            })
        }
        fetchStats()
    }, [])

    const cards = stats ? [
        { label: 'Urgentes', value: stats.urgentes, icon: AlertTriangle, color: 'text-red-500', bg: 'hover:bg-gray-200/10', question: '¿Cuáles son las incidencias con prioridad abiertas?' },
        { label: 'Abiertas', value: stats.abiertas, icon: Clock, color: 'text-amber-500', bg: 'hover:bg-gray-200/10', question: '¿Cuáles son todas las incidencias abiertas?' },
        { label: 'En progreso', value: stats.en_progreso, icon: BarChart2, color: 'text-blue-500', bg: 'hover:bg-gray-200/10', question: '¿Qué incidencias están en progreso?' },
        { label: 'Resueltas', value: stats.resueltas_hoy, icon: CheckCircle, color: 'text-emerald-500', bg: 'hover:bg-gray-200/10', question: '¿Cuántas incidencias se resolvieron hoy?' },
    ] : []

    return (
        <div className="space-y-8">
            <section>
                <div className="mb-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Estado Actual</h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {!stats
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl border bg-muted/20 animate-pulse" />
                        ))
                        : cards.map(({ label, value, icon: Icon, color, bg, question }) => (
                            <button
                                key={label}
                                onClick={() => onQuickQuestion(question)}
                                className={`group flex items-center gap-4 cursor-pointer rounded-2xl border border-transparent bg-background p-4 shadow-sm ring-1 ring-border transition-all hover:ring-primary/20 ${bg}`}
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-background transition-colors`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xl font-bold tracking-tight">{value}</p>
                                    <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                                </div>
                            </button>
                        ))}
                </div>
            </section>

            <section>
                <div className="mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Consultas frecuentes</h2>
                </div>
                <div className="space-y-2">
                    {[
                        '¿Quién tiene más tareas?',
                        'Última incidencia creada',
                        'Resumen por prioridad',
                    ].map(q => (
                        <button
                            key={q}
                            onClick={() => onQuickQuestion(q)}
                            className="w-full flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3 py-2.5 transition-all cursor-pointer group"
                        >
                            <MessageSquareText className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                            {q}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}