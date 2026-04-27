'use client'

import * as React from "react"
import { IconPlus, IconSearch, IconDotsVertical, IconTrash, IconEdit } from "@tabler/icons-react"
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
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { sileo } from "sileo"

interface Area {
    id: string
    name: string
    base_priority?: string
    created_at?: string
}

export default function AreasPage() {
    const [areas, setAreas] = React.useState<Area[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingArea, setEditingArea] = React.useState<Area | null>(null)
    const [formData, setFormData] = React.useState({ name: "", base_priority: "media" })
    const [errors, setErrors] = React.useState<{ name?: string; base_priority?: string }>({})
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchAreas = React.useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("areas")
                .select("*")
                .order("name")

            if (error) throw error
            const areaIds = (data || []).map((area) => area.id)
            const { data: rulesData, error: rulesError } = await supabase
                .from("area_priority_rules")
                .select("area_id, base_priority")
                .in("area_id", areaIds.length ? areaIds : ["00000000-0000-0000-0000-000000000000"])

            if (rulesError) throw rulesError
            const rulesByArea = new Map((rulesData || []).map((rule: any) => [rule.area_id, rule.base_priority]))
            setAreas((data || []).map((area) => ({
                ...area,
                base_priority: rulesByArea.get(area.id) || "media"
            })))
        } catch (error: any) {
            sileo.error({
                title: "Error al cargar áreas",
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchAreas()
    }, [fetchAreas])

    const filteredAreas = areas.filter((area) =>
        area.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleOpenCreate = () => {
        setEditingArea(null)
        setFormData({ name: "", base_priority: "media" })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleOpenEdit = (area: Area) => {
        setEditingArea(area)
        setFormData({ name: area.name, base_priority: area.base_priority || "media" })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta área?")) return

        try {
            const { error } = await supabase.from("areas").delete().eq("id", id)
            if (error) throw error
            sileo.success({
                title: "Área eliminada correctamente"
            })
            fetchAreas()
        } catch (error: any) {
            sileo.error({
                title: "Error al eliminar",
                description: error.message
            })
        }
    }

    const validateForm = () => {
        const newErrors: { name?: string; base_priority?: string } = {}
        if (!formData.name.trim()) {
            newErrors.name = "El nombre del área es requerido"
        }
        if (!formData.base_priority) {
            newErrors.base_priority = "La prioridad base es requerida"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setIsSaving(true)
            if (editingArea) {
                const { error } = await supabase
                    .from("areas")
                    .update({ name: formData.name })
                    .eq("id", editingArea.id)
                if (error) throw error
                const { error: rulesError } = await supabase
                    .from("area_priority_rules")
                    .upsert({
                        area_id: editingArea.id,
                        base_priority: formData.base_priority,
                    }, { onConflict: "area_id" })
                if (rulesError) throw rulesError
                sileo.success({ title: "Área actualizada correctamente" })
            } else {
                const { data: insertedArea, error } = await supabase
                    .from("areas")
                    .insert({ name: formData.name })
                    .select("id")
                    .single()
                if (error) throw error
                const { error: rulesError } = await supabase
                    .from("area_priority_rules")
                    .upsert({
                        area_id: insertedArea.id,
                        base_priority: formData.base_priority,
                    }, { onConflict: "area_id" })
                if (rulesError) throw rulesError
                sileo.success({ title: "Área creada correctamente" })
            }
            setIsSheetOpen(false)
            fetchAreas()
        } catch (error: any) {
            sileo.error({
                title: "Error al guardar",
                description: error.message
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Áreas</h1>
                    <p className="text-muted-foreground text-sm">Gestiona las áreas y su prioridad base automática.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <IconPlus className="size-4 mr-2" />
                    Nueva Área
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar área..."
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
                            <TableHead>Nombre</TableHead>
                            <TableHead>Prioridad Base</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filteredAreas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    No se encontraron áreas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAreas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="font-medium capitalize">{area.name}</TableCell>
                                    <TableCell className="capitalize">{area.base_priority || "media"}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <IconDotsVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(area)}>
                                                    <IconEdit className="size-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(area.id)}
                                                >
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
                        <SheetTitle>{editingArea ? "Editar Área" : "Nueva Área"}</SheetTitle>
                        <SheetDescription>
                            {editingArea
                                ? "Modifica los detalles del área."
                                : "Agrega una nueva área al sistema."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Área</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Mantenimiento"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.name && (
                                <p className="text-xs font-medium text-destructive">{errors.name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="base_priority">Prioridad base del área</Label>
                            <select
                                id="base_priority"
                                value={formData.base_priority}
                                onChange={(e) => setFormData({ ...formData, base_priority: e.target.value })}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
                            </select>
                            {errors.base_priority && (
                                <p className="text-xs font-medium text-destructive">{errors.base_priority}</p>
                            )}
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
