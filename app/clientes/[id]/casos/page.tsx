"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    ArrowLeft,
    Search,
    Loader2,
    AlertCircle,
    Scale,
    Calendar,
    Eye,
    Briefcase,
    User,
    Plus,
    Trash2,
} from "lucide-react"
import { AddCaseModal } from "@/components/AddCaseModal"

// Interfaces
interface ClienteAPI {
    id: number
    nombre: string
    tipo_cliente: string | null
    email: string | null
    telefono: string | null
    persona_contacto?: string | null
}

interface CasoAPI {
    id: number
    title: string
    description: string | null
    client_name: string
    status: string | null
    practice_area: string | null
    file_number: string | null
    court: string | null
    judge: string | null
    responsible_lawyer: string | null
    created_at: string | null
    start_date: string | null
    amount: number | null
}

export default function ClienteCasosPage() {
    const params = useParams()
    const router = useRouter()
    const clienteId = params.id as string

    // Estados
    const [cliente, setCliente] = useState<ClienteAPI | null>(null)
    const [casos, setCasos] = useState<CasoAPI[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false)
    const [deletingCaseId, setDeletingCaseId] = useState<number | null>(null)

    // Cargar datos del cliente
    const fetchCliente = async () => {
        try {
            const response = await fetch(`/api/clientes/${clienteId}`)
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)
            setCliente(result.data)
        } catch (err) {
            console.error("Error fetching cliente:", err)
            setError("Error al cargar el cliente")
        }
    }

    // Cargar casos del cliente
    const fetchCasos = async () => {
        try {
            const response = await fetch("/api/casos")
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            // Filtrar casos por nombre del cliente
            if (cliente?.nombre) {
                const casosDelCliente = (result.data || []).filter((caso: CasoAPI) =>
                    caso.client_name?.toLowerCase() === cliente.nombre.toLowerCase()
                )
                setCasos(casosDelCliente)
            }
        } catch (err) {
            console.error("Error fetching casos:", err)
            setError("Error al cargar los casos")
        }
    }

    // Cargar cliente al montar
    useEffect(() => {
        fetchCliente()
    }, [clienteId])

    // Cargar casos cuando tengamos el cliente
    useEffect(() => {
        if (cliente) {
            fetchCasos().finally(() => setLoading(false))
        }
    }, [cliente])

    // Función para borrar un caso
    const handleDeleteCase = async (casoId: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este caso? Esta acción no se puede deshacer.")) {
            return
        }

        setDeletingCaseId(casoId)
        try {
            const response = await fetch(`/api/casos/${casoId}`, {
                method: "DELETE",
            })
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Error al eliminar el caso")
            }

            // Remover el caso de la lista local
            setCasos((prevCasos) => prevCasos.filter((c) => c.id !== casoId))
        } catch (err) {
            console.error("Error deleting case:", err)
            alert(err instanceof Error ? err.message : "Error al eliminar el caso")
        } finally {
            setDeletingCaseId(null)
        }
    }

    // Filtrar casos por búsqueda
    const casosFiltrados = casos.filter((caso) =>
        caso.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caso.file_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caso.practice_area?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Helpers
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Sin fecha"
        const date = dateString.includes("T")
            ? new Date(dateString)
            : new Date(dateString + "T12:00:00")
        return date.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "activo": return "bg-green-100 text-green-700"
            case "en_progreso": return "bg-blue-100 text-blue-700"
            case "pendiente": return "bg-yellow-100 text-yellow-700"
            case "cerrado": return "bg-gray-100 text-gray-700"
            case "archivado": return "bg-purple-100 text-purple-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getStatusLabel = (status: string | null) => {
        switch (status) {
            case "activo": return "Activo"
            case "en_progreso": return "En Progreso"
            case "pendiente": return "Pendiente"
            case "cerrado": return "Cerrado"
            case "archivado": return "Archivado"
            default: return status || "Sin estado"
        }
    }

    // Vista de carga
    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-gray-500">Cargando casos del cliente...</p>
                </div>
            </div>
        )
    }

    // Vista de error
    if (error || !cliente) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                    <p className="text-gray-500">{error || "Cliente no encontrado"}</p>
                    <Button variant="outline" onClick={() => router.back()}>
                        Volver
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header con navegación */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent hover:text-purple-600 mb-4"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Clientes
                </Button>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                                    Casos de: {cliente.nombre}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {cliente.email || "Sin email"} • {cliente.tipo_cliente === "empresa" ? "Empresa" : "Persona"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 gap-2"
                            onClick={() => setIsAddCaseModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">Nuevo Caso</span>
                        </Button>
                        <Link href="/">
                            <Button variant="outline" className="gap-2">
                                <Briefcase className="w-4 h-4" />
                                <span className="hidden md:inline">Ver Todos los Casos</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Modal para agregar caso */}
            <AddCaseModal
                open={isAddCaseModalOpen}
                onOpenChange={setIsAddCaseModalOpen}
                preselectedCliente={cliente ? {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    telefono: cliente.telefono,
                    persona_contacto: cliente.persona_contacto || null
                } : undefined}
                onCaseCreated={() => {
                    fetchCasos()
                    setIsAddCaseModalOpen(false)
                }}
            />

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{casos.length}</p>
                                <p className="text-sm text-gray-600">Total Casos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {casos.filter(c => c.status === "activo" || c.status === "en_progreso").length}
                                </p>
                                <p className="text-sm text-gray-600">Activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {casos.filter(c => c.status === "pendiente").length}
                                </p>
                                <p className="text-sm text-gray-600">Pendientes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {casos.filter(c => c.status === "cerrado" || c.status === "archivado").length}
                                </p>
                                <p className="text-sm text-gray-600">Cerrados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de casos */}
            <Card className="border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="text-lg">Lista de Casos</CardTitle>
                        <div className="relative md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar casos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {casosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Scale className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {searchQuery ? "No se encontraron casos" : "Sin casos asociados"}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {searchQuery
                                    ? "Intenta con otra búsqueda"
                                    : "Este cliente no tiene casos registrados aún"}
                            </p>
                            <Link href="/">
                                <Button variant="outline">Ver Todos los Casos</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-medium text-gray-700">Caso</TableHead>
                                        <TableHead className="font-medium text-gray-700 hidden md:table-cell">Área</TableHead>
                                        <TableHead className="font-medium text-gray-700 hidden md:table-cell">Estado</TableHead>
                                        <TableHead className="font-medium text-gray-700 hidden md:table-cell">Fecha Inicio</TableHead>
                                        <TableHead className="font-medium text-gray-700 w-20">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {casosFiltrados.map((caso) => (
                                        <TableRow key={caso.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Scale className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{caso.title}</div>
                                                        {caso.file_number && (
                                                            <div className="text-sm text-gray-500 truncate">
                                                                Expediente: {caso.file_number}
                                                            </div>
                                                        )}
                                                        {/* Mostrar área y estado en móvil */}
                                                        <div className="md:hidden mt-1 flex flex-wrap gap-1">
                                                            {caso.practice_area && (
                                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                                                                    {caso.practice_area}
                                                                </Badge>
                                                            )}
                                                            <Badge className={`${getStatusColor(caso.status)} text-xs`}>
                                                                {getStatusLabel(caso.status)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {caso.practice_area ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                                        {caso.practice_area}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge className={getStatusColor(caso.status)}>
                                                    {getStatusLabel(caso.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(caso.start_date || caso.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/casos/${caso.id}`}>
                                                        <Button variant="ghost" size="sm" className="gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            <span className="hidden md:inline">Ver</span>
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteCase(caso.id)}
                                                        disabled={deletingCaseId === caso.id}
                                                    >
                                                        {deletingCaseId === caso.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
