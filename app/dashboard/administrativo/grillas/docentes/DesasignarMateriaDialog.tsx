"use client"

import React, { useState } from 'react'
import { X, AlertTriangle, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MateriaAsignada {
  id: number
  codigo: string
  nombre: string
  carrera: string
  año: string
  asignado: string  // Fecha de asignación
  estudiantes: number
  tieneMesaVigente?: boolean  // Para validar si tiene mesa de examen vigente
  fechaMesaVigente?: string  // Fecha de la mesa de examen vigente
}

interface DesasignarMateriaDialogProps {
  isOpen: boolean
  onClose: () => void
  docenteNombre: string
  docenteLegajo: string
  docenteId: string
  materiasAsignadas: MateriaAsignada[]
  onDesasignar: (materiasIds: number[]) => Promise<{ success: boolean; error?: string; mensaje?: string }>
  cargandoMaterias?: boolean
}

export default function DesasignarMateriaDialog({
  isOpen,
  onClose,
  docenteNombre,
  docenteLegajo,
  docenteId,
  materiasAsignadas,
  onDesasignar,
  cargandoMaterias = false
}: DesasignarMateriaDialogProps) {
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<number[]>([])
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !mostrarConfirmacion) {
      handleClose()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMateriasSeleccionadas([])
      setMostrarConfirmacion(false)
      setError('')
      setMensaje('')
      onClose()
    }
  }

  const toggleMateria = (materiaId: number) => {
    // Verificar si la materia tiene mesa de examen vigente asignada a este docente
    const materia = materiasAsignadas.find(m => m.id === materiaId)
    if (materia?.tieneMesaVigente) {
      setError('No puede desasignarse porque el docente está asignado a una mesa de examen vigente de esta materia')
      return
    }

    setError('')
    setMateriasSeleccionadas(prev => 
      prev.includes(materiaId)
        ? prev.filter(id => id !== materiaId)
        : [...prev, materiaId]
    )
  }

  const handleDesasignarClick = () => {
    setError('')
    
    // Validación: debe haber al menos una materia seleccionada
    if (materiasSeleccionadas.length === 0) {
      setError('Debe seleccionar al menos una materia para desasignar')
      return
    }

    // Mostrar confirmación
    setMostrarConfirmacion(true)
  }

  const confirmarDesasignacion = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await onDesasignar(materiasSeleccionadas)

      if (result.success) {
        setMensaje(result.mensaje || 'Materia(s) desasignada(s) exitosamente')
        // Esperar un momento para mostrar el mensaje y luego cerrar
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setMostrarConfirmacion(false)
        setError(result.error || 'Error al desasignar materia(s)')
      }
    } catch (err: any) {
      setMostrarConfirmacion(false)
      setError(err.message || 'Error inesperado al desasignar')
    } finally {
      setLoading(false)
    }
  }

  const cancelarConfirmacion = () => {
    setMostrarConfirmacion(false)
  }

  // Vista de confirmación
  if (mostrarConfirmacion) {
    const todasLasMaterias = materiasSeleccionadas.length === materiasAsignadas.length
    const quedaSinMaterias = todasLasMaterias

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={handleBackdropClick}
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Confirmar Desasignación
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
              ¿Está seguro que desea desasignar {materiasSeleccionadas.length} materia(s) al docente <span className="font-medium">{docenteNombre}</span>?
            </p>

            {quedaSinMaterias && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Advertencia:</strong> El docente quedará sin materias asignadas y será eliminado del sistema. Deberá darse de alta nuevamente para volver a ser docente.
                  </span>
                </p>
              </div>
            )}

            {mensaje && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 text-center">
                  {mensaje}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button 
                type="button"
                variant="outline" 
                onClick={cancelarConfirmacion}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmarDesasignacion}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Desasignando...' : 'Desasignar Seleccionadas'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista principal
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {docenteNombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Materias Asignadas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Seleccione las materias a desasignar
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Información del docente */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {docenteNombre}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Legajo: {docenteLegajo}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de materias */}
        <div className="flex-1 overflow-y-auto p-6">
          {cargandoMaterias ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-sm">Cargando materias asignadas...</p>
            </div>
          ) : materiasAsignadas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Este docente no tiene materias asignadas
            </div>
          ) : (
            <div className="space-y-3">
              {materiasAsignadas.map((materia) => (
                <div
                  key={materia.id}
                  onClick={() => toggleMateria(materia.id)}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${materiasSeleccionadas.includes(materia.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : materia.tieneMesaVigente
                      ? 'border-gray-200 bg-red-50 dark:bg-red-900/10 cursor-not-allowed opacity-60'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={materiasSeleccionadas.includes(materia.id)}
                      onChange={() => {}}
                      disabled={materia.tieneMesaVigente}
                      className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {materia.nombre}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {materia.carrera} • Año: {materia.año}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {materia.codigo}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Asignado: {materia.asignado}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {materia.estudiantes} estudiantes
                        </span>
                      </div>
                      {materia.tieneMesaVigente && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Mesa de examen vigente{materia.fechaMesaVigente ? ` (${materia.fechaMesaVigente})` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {materiasSeleccionadas.length} materia(s) seleccionada(s)
            </p>
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDesasignarClick}
                disabled={loading || cargandoMaterias || materiasSeleccionadas.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Desasignar Seleccionadas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
