'use client'

import * as React from "react"
import { IconPlus, IconSearch, IconDotsVertical, IconTrash, IconEdit, IconDoor } from "@tabler/icons-react"
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

interface Room {
    id: string
    room_code: string
    floor?: string
    created_at?: string
}

export default function RoomsPage() {
    const [rooms, setRooms] = React.useState<Room[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)
    const [formData, setFormData] = React.useState({ room_code: "", floor: "" })
    const [errors, setErrors] = React.useState<{ room_code?: string; floor?: string }>({})
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchRooms = React.useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("rooms")
                .select("*")
                .eq("active", true)
                .order("room_code")

            if (error) throw error
            setRooms(data || [])
        } catch (error: any) {
            sileo.error({ title: "Error al cargar habitaciones", description: error.message })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    const filteredRooms = rooms.filter((room) =>
        room.room_code.toLowerCase().includes(search.toLowerCase()) ||
        room.floor?.toString().includes(search.toLowerCase())
    )

    const handleOpenCreate = () => {
        setEditingRoom(null)
        setFormData({ room_code: "", floor: "" })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleOpenEdit = (room: Room) => {
        setEditingRoom(room)
        setFormData({ room_code: room.room_code, floor: room.floor?.toString() || "" })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de desactivar esta habitación?")) return

        try {
            const { error } = await supabase
                .from("rooms")
                .update({ active: false })
                .eq("id", id)

            if (error) throw error
            sileo.success({ title: "Habitación desactivada correctamente" })
            fetchRooms()
        } catch (error: any) {
            sileo.error({ title: "Error al eliminar", description: error.message })
        }
    }

    const validateForm = () => {
        const newErrors: { room_code?: string; floor?: string } = {}
        if (!formData.room_code.trim()) {
            newErrors.room_code = "El código de habitación es requerido"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setIsSaving(true)
            const payload = {
                room_code: formData.room_code,
                floor: formData.floor || null,
                active: true
            }

            if (editingRoom) {
                const { error } = await supabase
                    .from("rooms")
                    .update(payload)
                    .eq("id", editingRoom.id)
                if (error) throw error
                sileo.success({ title: "Habitación actualizada correctamente" })
            } else {
                const { error } = await supabase
                    .from("rooms")
                    .insert(payload)
                if (error) throw error
                sileo.success({ title: "Habitación creada correctamente" })
            }
            setIsSheetOpen(false)
            fetchRooms()
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
                    <h1 className="text-2xl font-semibold">Habitaciones</h1>
                    <p className="text-muted-foreground text-sm">Gestiona las habitaciones del hotel.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <IconPlus className="size-4 mr-2" />
                    Nueva Habitación
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por código o piso..."
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
                            <TableHead>Código</TableHead>
                            <TableHead>Piso</TableHead>
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
                        ) : filteredRooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    No se encontraron habitaciones.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRooms.map((room) => (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <IconDoor className="size-4 text-muted-foreground" />
                                            {room.room_code}
                                        </div>
                                    </TableCell>
                                    <TableCell>{room.floor || "—"}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <IconDotsVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(room)}>
                                                    <IconEdit className="size-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(room.id)}
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
                        <SheetTitle>{editingRoom ? "Editar Habitación" : "Nueva Habitación"}</SheetTitle>
                        <SheetDescription>
                            {editingRoom
                                ? "Modifica los detalles de la habitación."
                                : "Agrega una nueva habitación al sistema."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="room_code">Código de Habitación</Label>
                            <Input
                                id="room_code"
                                placeholder="Ej: A-203"
                                value={formData.room_code}
                                onChange={(e) => setFormData({ ...formData, room_code: e.target.value.toUpperCase() })}
                                className={errors.room_code ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.room_code && (
                                <p className="text-xs font-medium text-destructive">{errors.room_code}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="floor">Piso</Label>
                            <Input
                                id="floor"
                                type="number"
                                placeholder="Ej: 2"
                                value={formData.floor}
                                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                            />
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
