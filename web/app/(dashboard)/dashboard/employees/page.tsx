'use client'

import * as React from "react"
import { IconPlus, IconSearch, IconDotsVertical, IconTrash, IconEdit, IconUser } from "@tabler/icons-react"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { sileo } from "sileo"

interface Area {
    id: number
    name: string
}

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    role: string
    area?: string | null
    created_at?: string
}

export default function EmployeesPage() {
    const [employees, setEmployees] = React.useState<Profile[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingEmployee, setEditingEmployee] = React.useState<Profile | null>(null)
    const [formData, setFormData] = React.useState({
        full_name: "",
        email: "",
        password: "",
        role: "",
        area: ""
    })
    const [errors, setErrors] = React.useState<any>({})
    const [isSaving, setIsSaving] = React.useState(false)
    const [areas, setAreas] = React.useState<Area[]>([])

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)

            const [profilesRes, areasRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("active", true).order("full_name"),
                supabase.from("areas").select("id, name").order("name")
            ])

            if (profilesRes.error) throw profilesRes.error
            if (areasRes.error) throw areasRes.error

            setEmployees(profilesRes.data || [])
            setAreas(areasRes.data || [])
        } catch (error: any) {
            sileo.error({ title: "Error al cargar datos", description: error.message })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredEmployees = employees.filter((emp) =>
    (emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()))
    )

    const handleOpenCreate = () => {
        setEditingEmployee(null)
        setFormData({ full_name: "", email: "", password: "", role: "empleado", area: "" })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleOpenEdit = (emp: any) => {
        setEditingEmployee(emp)
        setFormData({
            full_name: emp.full_name || "",
            email: emp.email || "",
            password: "",
            role: emp.role || "",
            area: emp.area || ""
        })
        setErrors({})
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de desactivar este perfil?")) return

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ active: false })
                .eq("id", id)
            if (error) throw error
            sileo.success({ title: "Perfil desactivado" })
            fetchData()
        } catch (error: any) {
            sileo.error({ title: "Error al desactivar", description: error.message })
        }
    }

    const validateForm = () => {
        const newErrors: any = {}
        if (!formData.full_name.trim()) newErrors.full_name = "El nombre es requerido"
        if (!formData.email.trim()) newErrors.email = "El email es requerido"
        if (!editingEmployee && !formData.password) newErrors.password = "La contraseña es requerida"
        if (formData.role !== 'admin' && !formData.area) newErrors.area = "Debe asignar un área al empleado"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setIsSaving(true)
            if (editingEmployee) {
                // Update profile
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        area: formData.role !== 'admin' ? formData.area : null
                    })
                    .eq("id", editingEmployee.id)
                if (profileError) throw profileError

                sileo.success({ title: "Empleado actualizado correctamente" })
            } else {
                // Create user via sign up
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.full_name,
                            role: formData.role,
                            area: formData.role !== 'admin' ? formData.area : null
                        }
                    }
                })
                if (authError) throw authError

                if (authData.user) {
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: authData.user.id,
                            email: formData.email,
                            full_name: formData.full_name,
                            role: formData.role,
                            area: formData.role !== 'admin' ? formData.area : null,
                            active: true
                        })
                    if (insertError) {
                        alert("Error, No se pudo crear el empleado. Intenta de nuevo.")
                    }
                }

                sileo.success({ title: "Empleado creado correctamente", description: "Se ha enviado un correo de confirmación." })
            }
            setIsSheetOpen(false)
            fetchData()
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
                    <h1 className="text-2xl font-semibold">Empleados</h1>
                    <p className="text-muted-foreground text-sm">Gestiona los perfiles de empleados y administradores.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <IconPlus className="size-4 mr-2" />
                    Nuevo Empleado
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o email..."
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
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    No se encontraron empleados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <IconUser className="size-4 text-muted-foreground" />
                                            {emp.full_name || "Sin nombre"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{emp.email || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={emp.role === 'admin' ? 'default' : 'outline'}>
                                            {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
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
                                                <DropdownMenuItem onClick={() => handleOpenEdit(emp)}>
                                                    <IconEdit className="size-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(emp.id)}
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
                        <SheetTitle>{editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}</SheetTitle>
                        <SheetDescription>
                            {editingEmployee
                                ? "Modifica los detalles del perfil del empleado."
                                : "Se recomienda crear empleados vía registro de usuario."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre Completo</Label>
                            <Input
                                id="full_name"
                                placeholder="Ej: Juan Pérez"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={errors.full_name ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.full_name && <p className="text-xs font-medium text-destructive">{errors.full_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan@hotel.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!!editingEmployee}
                                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
                        </div>
                        {!editingEmployee && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="empleado">Empleado</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.role !== 'admin' && (
                            <div className="space-y-2">
                                <Label>Área Asignada</Label>
                                <Select
                                    value={formData.area}
                                    onValueChange={(value) => setFormData({ ...formData, area: value })}
                                >
                                    <SelectTrigger className={errors.area ? "border-destructive focus-visible:ring-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar área" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areas.map((area) => (
                                            <SelectItem className="capitalize" key={area.id} value={area.name}>
                                                {area.name.charAt(0).toUpperCase() + area.name.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.area && <p className="text-xs font-medium text-destructive">{errors.area}</p>}
                            </div>
                        )}
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
