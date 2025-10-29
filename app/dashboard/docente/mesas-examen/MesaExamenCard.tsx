'use client'

import { Calendar, Clock, MapPin, FileText, Check, Edit, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { 
  actualizarEstadoMesa, 
  marcarNotasCargadas, 
  eliminarMesa, 
  type MesaExamen 
} from './actions'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface MesaExamenCardProps {
  mesa: MesaExamen
}

export default function MesaExamenCard({ mesa }: MesaExamenCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Formatear hora
  const formatearHora = (hora: string) => {
    return hora.slice(0, 5) // Solo HH:MM
  }

  // Obtener color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
      case 'finalizada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
    }
  }

  // Verificar si la mesa necesita notificación
  const necesitaNotificacion = () => {
    if (mesa.estado !== 'finalizada' || mesa.notas_cargadas) return false
    
    const fechaExamen = new Date(mesa.fecha_examen)
    const hoy = new Date()
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaExamen.getTime()) / (1000 * 60 * 60 * 24))
    
    return diasTranscurridos >= 14
  }

  // Manejar cambio de estado (DESACTIVADO según solicitud)
  const handleCambiarEstado = async (nuevoEstado: 'programada' | 'finalizada' | 'cancelada') => {
    // Función desactivada por solicitud del usuario
    console.log('Función de cambio de estado desactivada')
    setShowActions(false)
    return
  }

  // Manejar carga de notas
  const handleMarcarNotas = async (cargadas: boolean) => {
    setIsLoading(true)
    try {
      const result = await marcarNotasCargadas(mesa.id, cargadas)
      if (result.success) {
        window.location.reload() // Recargar para ver cambios
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error al marcar notas:', error)
      alert('Error al actualizar las notas')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar eliminación
  const handleEliminar = async () => {
    setShowDeleteDialog(true)
    setShowActions(false)
  }

  // Confirmar eliminación
  const handleConfirmEliminar = async () => {
    setIsLoading(true)
    try {
      const result = await eliminarMesa(mesa.id)
      if (result.success) {
        setShowDeleteDialog(false)
        window.location.reload() // Recargar para ver cambios
      } else {
        alert(`Error: ${result.error}`)
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar la mesa')
      setShowDeleteDialog(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative">
        {/* Header con materia y estado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {mesa.materia?.codigo_materia} - {mesa.materia?.nombre}
            </h3>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(mesa.estado)}`}>
                {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
              </span>
              {mesa.notas_cargadas && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Notas Cargadas
                </span>
              )}
              {necesitaNotificacion() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requiere Atención
                </span>
              )}
            </div>
          </div>

          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Edit className="h-4 w-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-10">
                <div className="py-1">
                  {mesa.estado === 'programada' && (
                    <button
                      onClick={() => handleCambiarEstado('finalizada')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
                      disabled
                      title="Funcionalidad desactivada"
                    >
                      Marcar como Finalizada
                    </button>
                  )}
                  {mesa.estado === 'finalizada' && !mesa.notas_cargadas && (
                    <button
                      onClick={() => handleMarcarNotas(true)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Marcar Notas Cargadas
                    </button>
                  )}
                  {mesa.estado === 'finalizada' && mesa.notas_cargadas && (
                    <button
                      onClick={() => handleMarcarNotas(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Desmarcar Notas Cargadas
                    </button>
                  )}
                  {mesa.estado === 'programada' && (
                    <>
                      <button
                        onClick={() => handleCambiarEstado('cancelada')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50"
                        disabled
                        title="Funcionalidad desactivada"
                      >
                        Cancelar Mesa
                      </button>
                      <button
                        onClick={handleEliminar}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        Eliminar Mesa
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de la mesa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formatearFecha(mesa.fecha_examen)}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formatearHora(mesa.hora_examen)}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{mesa.ubicacion}</span>
          </div>
        </div>

        {/* Comentarios */}
        {mesa.comentarios && (
          <div className="flex items-start space-x-2 text-slate-600 dark:text-slate-400 mb-4">
            <FileText className="h-4 w-4 mt-0.5" />
            <span className="text-sm">{mesa.comentarios}</span>
          </div>
        )}

        {/* Alertas y notificaciones */}
        {necesitaNotificacion() && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
              <p className="text-sm text-orange-700 dark:text-orange-200">
                Han transcurrido más de 2 semanas desde el examen sin cargar notas. Se debe notificar al sistema.
              </p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mesa #{mesa.id}</span>
            <span>Creada: {new Date(mesa.created_at).toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        {/* Overlay de carga */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dialog de confirmación de eliminación usando componente UI existente */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Eliminar Mesa de Examen"
        message={`¿Estás seguro de que deseas eliminar la mesa de examen de ${mesa.materia?.codigo_materia} - ${mesa.materia?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Mesa"
        cancelLabel="Cancelar"
        loading={isLoading}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmEliminar}
      />
    </>
  )
}