'use client'

import * as React from "react"
import { IconPlus, IconSearch, IconDotsVertical, IconTrash, IconKey, IconDownload, IconPrinter, IconCopy, IconCheck } from "@tabler/icons-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sileo } from "sileo"
import { QRCodeCanvas } from 'qrcode.react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Room {
    id: string
    room_code: string
}

interface Session {
    id: string
    room_id: string
    access_code: string
    active: boolean
    expires_at: string
    created_at: string
    room?: {
        room_code: string
    }
}

export default function SessionsPage() {
    const [sessions, setSessions] = React.useState<Session[]>([])
    const [rooms, setRooms] = React.useState<Room[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [isResultDialogOpen, setIsResultDialogOpen] = React.useState(false)
    const [currentSession, setCurrentSession] = React.useState<Session | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [copied, setCopied] = React.useState(false)

    const [formData, setFormData] = React.useState({
        room_id: "",
        expires_at: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
    })
    const [errors, setErrors] = React.useState<any>({})

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            const [sessionsRes, roomsRes] = await Promise.all([
                supabase.from("guest_sessions").select("*, room:rooms(room_code)").order("created_at", { ascending: false }),
                supabase.from("rooms").select("id, room_code").eq("active", true).order("room_code")
            ])

            if (sessionsRes.error) throw sessionsRes.error
            if (roomsRes.error) throw roomsRes.error

            setSessions(sessionsRes.data || [])
            setRooms(roomsRes.data || [])
        } catch (error: any) {
            sileo.error({ title: "Error al cargar datos", description: error.message })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredSessions = sessions.filter((s) =>
        s.room?.room_code.toLowerCase().includes(search.toLowerCase()) ||
        s.access_code.toLowerCase().includes(search.toLowerCase())
    )

    const generateAccessCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    const validateForm = () => {
        const newErrors: any = {}
        if (!formData.room_id) newErrors.room_id = "Debe seleccionar una habitación"
        if (!formData.expires_at) newErrors.expires_at = "Debe seleccionar una fecha de expiración"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setIsSaving(true)
            const accessCode = generateAccessCode()

            const { data, error } = await supabase
                .from("guest_sessions")
                .insert({
                    room_id: formData.room_id,
                    access_code: accessCode,
                    expires_at: formData.expires_at,
                    active: true
                })
                .select("*, room:rooms(room_code)")
                .single()

            if (error) console.error(error)

            sileo.success({ title: "Sesión creada correctamente" })
            setIsSheetOpen(false)
            setCurrentSession(data)
            setIsResultDialogOpen(true)
            fetchData()
        } catch (error: any) {
            sileo.error({ title: "Error al crear sesión", description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de desactivar esta sesión?")) return

        try {
            const { error } = await supabase
                .from("guest_sessions")
                .update({ active: false })
                .eq("id", id)
            if (error) throw error
            sileo.success({ title: "Sesión desactivada" })
            fetchData()
        } catch (error: any) {
            sileo.error({ title: "Error al desactivar", description: error.message })
        }
    }

    const copyToClipboard = () => {
        if (!currentSession) return
        navigator.clipboard.writeText(currentSession.access_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQRCode = () => {
        const canvas = document.getElementById("session-qr") as HTMLCanvasElement
        if (!canvas) return
        const url = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `QR_Session_${currentSession?.room?.room_code || 'Code'}.png`
        link.href = url
        link.click()
    }

    const printSession = () => {
        window.print()
    }

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por habitación o código..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsSheetOpen(true)} className="gap-2">
                    <IconPlus className="size-4" />
                    Nueva Sesión
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Habitación</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Expira</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filteredSessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No se encontraron sesiones.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">
                                        Habitación {session.room?.room_code || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                            {session.access_code}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(session.expires_at), "PPP p", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={session.active ? "default" : "secondary"}>
                                            {session.active ? "Activa" : "Expirada/Inactiva"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <IconDotsVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setCurrentSession(session)
                                                    setIsResultDialogOpen(true)
                                                }}>
                                                    <IconKey className="size-4 mr-2" />
                                                    Ver Acceso
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(session.id)}
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
                        <SheetTitle>Nueva Sesión de Huésped</SheetTitle>
                        <SheetDescription>
                            Asigna una habitación y establece el tiempo de acceso para el huésped.
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label>Habitación</Label>
                            <Select
                                value={formData.room_id}
                                onValueChange={(val) => setFormData({ ...formData, room_id: val })}
                            >
                                <SelectTrigger className={errors.room_id ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Seleccionar habitación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={room.id}>
                                            Habitación {room.room_code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.room_id && <p className="text-xs text-destructive">{errors.room_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expires_at">Fecha de Expiración</Label>
                            <Input
                                id="expires_at"
                                type="datetime-local"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                className={errors.expires_at ? "border-destructive" : ""}
                            />
                            {errors.expires_at && <p className="text-xs text-destructive">{errors.expires_at}</p>}
                        </div>
                        <SheetFooter className="px-0">
                            <Button type="submit" disabled={isSaving} className="w-full">
                                {isSaving ? "Creando..." : "Crear Sesión"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Acceso para Huésped</DialogTitle>
                        <DialogDescription>
                            Comparte este código o QR con el huésped asignado a la habitación {currentSession?.room?.room_code}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            <QRCodeCanvas
                                id="session-qr"
                                value={JSON.stringify({ access_code: currentSession?.access_code })}
                                size={200}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <Label className="text-center block text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Código de Acceso</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted p-3 rounded-lg text-center font-mono text-xl font-bold border">
                                    {currentSession?.access_code}
                                </div>
                                <Button size="icon" variant="outline" onClick={copyToClipboard} className="h-full px-5">
                                    {copied ? <IconCheck className="size-5 text-green-500" /> : <IconCopy className="size-5" />}
                                </Button>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-2 mt-4 print:hidden">
                            <Button variant="secondary" onClick={downloadQRCode} className="gap-2">
                                <IconDownload className="size-4" />
                                Descargar
                            </Button>
                            <Button variant="secondary" onClick={printSession} className="gap-2">
                                <IconPrinter className="size-4" />
                                Imprimir
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                    }
                }
            `}</style>
        </div>
    )
}
