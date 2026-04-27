'use client'

import * as React from "react"
import { IconDotsVertical, IconEdit, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { sileo } from "sileo"

interface KeywordRule {
    id: string
    keyword: string
    priority: string
}

export default function PriorityKeywordsPage() {
    const [rows, setRows] = React.useState<KeywordRule[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingRow, setEditingRow] = React.useState<KeywordRule | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [formData, setFormData] = React.useState({ keyword: "", priority: "media" })

    const fetchRows = React.useCallback(async () => {
        try {
            setLoading(true)
            console.log("[priority-keywords] Iniciando carga de palabras clave")
            const { data: authData, error: authError } = await supabase.auth.getUser()
            console.log("[priority-keywords] Usuario autenticado:", authData?.user?.id || null)
            if (authError) {
                console.error("[priority-keywords] Error obteniendo usuario:", authError)
            }

            const response = await fetch("/api/priority-keywords", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            })

            const payload = await response.json()
            // #region agent log
            fetch('http://127.0.0.1:7691/ingest/06b09fcc-a127-44b1-b180-d825926153c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af572f'},body:JSON.stringify({sessionId:'af572f',runId:`priority-keywords-fetch-${Date.now()}`,hypothesisId:'H5',location:'web/app/(dashboard)/dashboard/priority-keywords/page.tsx:fetchRows',message:'Priority keywords fetch response',data:{ok:response.ok,status:response.status,count:payload?.data?.length||0,sample:(payload?.data||[]).slice(0,3)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            console.log("[priority-keywords] Resultado API:", {
                ok: response.ok,
                status: response.status,
                rows: payload?.data?.length ?? 0,
                sample: payload?.data?.slice?.(0, 3) ?? [],
                error: payload?.error ?? null,
            })

            if (!response.ok) {
                throw new Error(payload?.error || "No se pudieron cargar palabras clave")
            }

            setRows(payload.data || [])
        } catch (error: any) {
            console.error("[priority-keywords] Catch fetchRows:", error)
            sileo.error({ title: "Error al cargar palabras clave", description: error.message })
        } finally {
            setLoading(false)
            console.log("[priority-keywords] Fin de carga")
        }
    }, [])

    React.useEffect(() => {
        fetchRows()
    }, [fetchRows])

    const filteredRows = rows.filter((row) => row.keyword.toLowerCase().includes(search.toLowerCase()))

    const handleOpenCreate = () => {
        setEditingRow(null)
        setFormData({ keyword: "", priority: "media" })
        setIsSheetOpen(true)
    }

    const handleOpenEdit = (row: KeywordRule) => {
        setEditingRow(row)
        setFormData({ keyword: row.keyword, priority: row.priority })
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta palabra clave?")) return
        try {
            const { error } = await supabase.from("priority_keywords").delete().eq("id", id)
            if (error) throw error
            sileo.success({ title: "Palabra clave eliminada" })
            fetchRows()
        } catch (error: any) {
            sileo.error({ title: "Error al eliminar", description: error.message })
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.keyword.trim()) {
            sileo.error({ title: "Validación", description: "La palabra clave es requerida" })
            return
        }

        try {
            const runId = `priority-keyword-save-${Date.now()}`
            setIsSaving(true)
            if (editingRow) {
                // #region agent log
                fetch('http://127.0.0.1:7691/ingest/06b09fcc-a127-44b1-b180-d825926153c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af572f'},body:JSON.stringify({sessionId:'af572f',runId,hypothesisId:'H3',location:'web/app/(dashboard)/dashboard/priority-keywords/page.tsx:before-update',message:'Priority keyword update attempt',data:{id:editingRow.id,keyword:formData.keyword.trim().toLowerCase(),priority:formData.priority},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                const { error } = await supabase
                    .from("priority_keywords")
                    .update({
                        keyword: formData.keyword.trim().toLowerCase(),
                        priority: formData.priority,
                    })
                    .eq("id", editingRow.id)
                // #region agent log
                fetch('http://127.0.0.1:7691/ingest/06b09fcc-a127-44b1-b180-d825926153c9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af572f'},body:JSON.stringify({sessionId:'af572f',runId,hypothesisId:'H3',location:'web/app/(dashboard)/dashboard/priority-keywords/page.tsx:after-update',message:'Priority keyword update result',data:{id:editingRow.id,hasError:Boolean(error),errorMessage:error?.message||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion

                if (error) throw error
                sileo.success({ title: "Palabra clave actualizada" })
            } else {
                const { error } = await supabase
                    .from("priority_keywords")
                    .insert({
                        keyword: formData.keyword.trim().toLowerCase(),
                        priority: formData.priority,
                    })
                if (error) throw error
                sileo.success({ title: "Palabra clave creada" })
            }
            setIsSheetOpen(false)
            fetchRows()
        } catch (error: any) {
            sileo.error({ title: "Error al guardar", description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Palabras clave de prioridad</h1>
                    <p className="text-muted-foreground text-sm">Configura palabras que elevan la urgencia automáticamente.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <IconPlus className="size-4 mr-2" />
                    Nueva palabra
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar palabra clave..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Palabra clave</TableHead>
                            <TableHead>Nivel de urgencia</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">No se encontraron palabras clave.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium capitalize">{row.keyword}</TableCell>
                                    <TableCell className="capitalize">{row.priority}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <IconDotsVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(row)}>
                                                    <IconEdit className="size-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.id)}>
                                                    <IconTrash className="size-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingRow ? "Editar palabra clave" : "Nueva palabra clave"}</SheetTitle>
                        <SheetDescription>Define la palabra y el nivel de urgencia asociado.</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="keyword">Palabra clave</Label>
                            <Input
                                id="keyword"
                                placeholder="Ej: humo"
                                value={formData.keyword}
                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Nivel de urgencia</Label>
                            <select
                                id="priority"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
                            </select>
                        </div>
                        <SheetFooter className="px-0">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
