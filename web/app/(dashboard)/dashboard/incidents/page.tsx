'use client'

import * as React from "react"
import { IconPlus, IconDotsVertical, IconTrash, IconEdit, IconAlertTriangle, IconCheck } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { sileo } from "sileo"

export default function IncidentsCRUDPage() {
    const [incidents, setIncidents] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingIncident, setEditingIncident] = React.useState<any>(null)

    const [areas, setAreas] = React.useState<any[]>([])
    const [rooms, setRooms] = React.useState<any[]>([])
    const [employees, setEmployees] = React.useState<any[]>([])

    const [formData, setFormData] = React.useState({
        title: "",
        description: "",
        status: "pendiente",
        priority: "media",
        area_id: "",
        room_id: "",
        assigned_to: "",
    })
    const [errors, setErrors] = React.useState<any>({})
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)

            const [areasRes, roomsRes, employeesRes] = await Promise.all([
                supabase.from("areas").select("id, name").order("name"),
                supabase.from("rooms").select("id, room_code").eq("active", true).order("room_code"),
                supabase.from("profiles").select("id, full_name, role, area").eq("active", true).order("full_name")
            ])

            if (areasRes.error) throw areasRes.error
            if (roomsRes.error) throw roomsRes.error
            if (employeesRes.error) throw employeesRes.error

            setAreas(areasRes.data || [])
            setRooms(roomsRes.data || [])
            setEmployees(employeesRes.data || [])

            const { data: incidentsData, error } = await supabase
                .from("incidents")
                .select(`
            id,
            title,
            description,
            status,
            priority,
            created_at,
            area:areas(id, name),
            room:rooms(id, room_code),
            assignee:profiles!incidents_assigned_to_fkey(id, full_name, role, area)
        `)
                .order("created_at", { ascending: false })

            if (error) throw error

            const tableData = (incidentsData || []).map((incident: any, index: number) => ({
                id: index + 1,
                uuid: incident.id,
                title: incident.title || "Sin título",
                description: incident.description,
                status: incident.status || "pendiente",
                priority: incident.priority || "media",
                area: incident.area?.name || "Sin área",
                area_id: incident.area?.id,
                room: incident.room?.room_code || "Sin habitación",
                room_id: incident.room?.id,
                assigned_to: incident.assignee?.full_name || "Sin asignar",
                assigned_to_id: incident.assignee?.id,
                created_at: incident.created_at || "",
            }))

            setIncidents(tableData)
        } catch (error: any) {
            sileo.error({ title: "Error al cargar datos", description: error.message })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleOpenCreate = () => {
        setEditingIncident(null)
        setFormData({
            title: "",
            description: "",
            status: "pendiente",
            priority: "media",
            area_id: "",
            room_id: "",
            assigned_to: "",
        })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleOpenEdit = (incident: any) => {
        setEditingIncident(incident)
        setFormData({
            title: incident.title,
            description: incident.description || "",
            status: incident.status,
            priority: incident.priority,
            area_id: incident.area_id?.toString() || "",
            room_id: incident.room_id?.toString() || "",
            assigned_to: incident.assigned_to_id || "",
        })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleDelete = async (uuid: string) => {
        if (!confirm("¿Estás seguro de eliminar esta incidencia?")) return

        try {
            const { error } = await supabase.from("incidents").delete().eq("id", uuid)
            if (error) throw error
            sileo.success({ title: "Incidencia eliminada" })
            fetchData()
        } catch (error: any) {
            sileo.error({ title: "Error al eliminar", description: error.message })
        }
    }

    const validateForm = () => {
        const newErrors: any = {}
        if (!formData.title.trim()) newErrors.title = "El título es requerido"
        if (!formData.area_id) newErrors.area_id = "El área es requerida"
        if (!formData.room_id) newErrors.room_id = "La habitación es requerida"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("No hay una sesión activa");
            }

            setIsSaving(true)
            const payload = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                area_id: formData.area_id || null,
                room_id: formData.room_id || null,
                assigned_to: formData.assigned_to && formData.assigned_to !== 'none' ? formData.assigned_to : null,
                created_by: user?.id
            }

            if (editingIncident) {
                const { error } = await supabase
                    .from("incidents")
                    .update(payload)
                    .eq("id", editingIncident.uuid)
                if (error) throw error
                sileo.success({ title: "Incidencia actualizada" })
            } else {
                const { error } = await supabase
                    .from("incidents")
                    .insert(payload)
                if (error) throw error
                sileo.success({ title: "Incidencia creada" })
            }
            setIsSheetOpen(false)
            fetchData()
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
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 bg-background">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                    <h1 className="text-2xl font-semibold">Gestión de Incidencias</h1>
                    <p className="text-muted-foreground text-sm">Crea, edita y gestiona todas las incidencias del hotel.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <IconPlus className="size-4 mr-2" />
                    Nueva Incidencia
                </Button>
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Cargando incidencias...</p>
                    </div>
                ) : (
                    <DataTable
                        data={incidents}
                    />
                )}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingIncident ? "Editar Incidencia" : "Nueva Incidencia"}</SheetTitle>
                        <SheetDescription>
                            Completa los detalles de la incidencia.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                placeholder="Ej: Aire acondicionado no enfría"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.title && <p className="text-xs font-medium text-destructive">{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                placeholder="Detalles sobre el problema..."
                                value={formData.description}
                                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                        <SelectItem value="recibida">Recibida</SelectItem>
                                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                                        <SelectItem value="resuelta">Resuelta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Prioridad</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baja">Baja</SelectItem>
                                        <SelectItem value="media">Media</SelectItem>
                                        <SelectItem value="alta">Alta</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Área</Label>
                                <Select
                                    value={formData.area_id}
                                    onValueChange={(value) => setFormData({ ...formData, area_id: value, assigned_to: "" })}
                                >
                                    <SelectTrigger className={errors.area_id ? "border-destructive focus-visible:ring-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areas.map((area) => (
                                            <SelectItem className="capitalize" key={area.id} value={area.id}>
                                                {area.name.charAt(0).toUpperCase() + area.name.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.area_id && <p className="text-xs font-medium text-destructive">{errors.area_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Habitación</Label>
                                <Select
                                    value={formData.room_id}
                                    onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                                >
                                    <SelectTrigger className={errors.room_id ? "border-destructive focus-visible:ring-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.room_code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.room_id && <p className="text-xs font-medium text-destructive">{errors.room_id}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Asignar a</Label>
                            <Select
                                value={formData.assigned_to}
                                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                                disabled={!formData.area_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={formData.area_id ? "Sin asignar" : "Selecciona un área primero"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {employees
                                        .filter(emp => {
                                            if (emp.role === 'admin') return true;
                                            const selectedArea = areas.find(a => a.id === formData.area_id);
                                            if (!selectedArea) return false;
                                            // Normalize comparison: lowercase and no accents if possible
                                            const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                            return normalize(emp.area || "") === normalize(selectedArea.name);
                                        })
                                        .map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.full_name || "Desconocido"} {emp.role === 'admin' ? '(Admin)' : ''}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <SheetFooter className="mt-6 px-0">
                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? "Guardando..." : (editingIncident ? "Actualizar" : "Crear Incidencia")}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
