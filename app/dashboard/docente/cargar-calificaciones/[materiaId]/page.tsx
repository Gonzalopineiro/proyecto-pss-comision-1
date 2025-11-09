'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, BookOpen, Calendar, User } from 'lucide-react'
import { obtenerDatosCursada, obtenerInscriptosCursada } from './actions'

interface InscriptoData {
  legajo: string
  nombre: string
  email: string
  estado: string
}

interface DatosCursada {
  materia: string
  codigo_materia: string
  anio: number
  cuatrimestre: number
  estado: string
  docente: string
  totalInscriptos: number
}

export default function CargarCalificacionesPage() {
  const params = useParams()
  const router = useRouter()
  const materiaId = params.materiaId as string

  const [datosCursada, setDatosCursada] = useState<DatosCursada | null>(null)
  const [inscriptos, setInscriptos] = useState<InscriptoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener datos de la cursada
        const datosCursadaResult = await obtenerDatosCursada(materiaId)
        if (!datosCursadaResult.success) {
          if (datosCursadaResult.noData) {
            // Es un caso esperado (sin cursada), no un error técnico
            setError(datosCursadaResult.error || 'No hay cursada asociada')
          } else {
            throw new Error(datosCursadaResult.error || 'Error al obtener datos de la cursada')
          }
          return
        }
        setDatosCursada(datosCursadaResult.data)

        // Obtener inscriptos
        const inscriptosResult = await obtenerInscriptosCursada(materiaId)
        if (!inscriptosResult.success) {
          throw new Error(inscriptosResult.error || 'Error al obtener inscriptos')
        }
        setInscriptos(inscriptosResult.inscriptos)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        console.error('Error al cargar datos:', err)
      } finally {
        setLoading(false)
      }
    }

    if (materiaId) {
      cargarDatos()
    }
  }, [materiaId])

  const handleVolver = () => {
    router.push('/dashboard/docente')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos de la cursada...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Información</CardTitle>
            <CardDescription className="text-blue-600">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleVolver}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Información de la Cursada */}
      {datosCursada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Cargar Calificaciones de Cursada</span>
            </CardTitle>
            <CardDescription>
              Gestión de calificaciones para la cursada seleccionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Materia</div>
                <div className="font-semibold">{datosCursada.codigo_materia}</div>
                <div className="text-sm text-gray-600">{datosCursada.materia}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Período</div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">
                    {datosCursada.anio} - {datosCursada.cuatrimestre}° Cuatrimestre
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Docente</div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{datosCursada.docente}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Estado</div>
                <Badge variant={datosCursada.estado === 'activa' ? 'default' : 'secondary'}>
                  {datosCursada.estado}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Inscriptos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lista de Alumnos Inscriptos</span>
            <Badge variant="outline" className="ml-2">
              {inscriptos.length} estudiantes
            </Badge>
          </CardTitle>
          <CardDescription>
            Alumnos inscriptos en esta cursada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inscriptos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay alumnos inscriptos en esta cursada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700 w-32">Legajo</th>
                    <th className="text-left p-4 font-medium text-gray-700">Alumno</th>
                    <th className="text-left p-4 font-medium text-gray-700">Email</th>
                    <th className="text-left p-4 font-medium text-gray-700 w-40">Estado Cursada</th>
                    <th className="text-left p-4 font-medium text-gray-700 w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptos.map((inscripto, index) => (
                    <tr key={`${inscripto.legajo}-${index}`} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {inscripto.legajo}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {inscripto.nombre}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {inscripto.email}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            inscripto.estado.toLowerCase().includes('aprobado') ? 'default' : 
                            inscripto.estado.toLowerCase().includes('desaprobado') ? 'destructive' : 
                            inscripto.estado.toLowerCase().includes('pendiente') ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {inscripto.estado}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled
                          className="text-xs"
                        >
                          Cargar Nota
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}