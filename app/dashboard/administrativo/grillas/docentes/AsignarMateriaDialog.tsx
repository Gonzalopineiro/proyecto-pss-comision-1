"use client"

import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AsignarMateriaDialogProps {
  isOpen: boolean
  onClose: () => void
  docenteNombre: string
  docenteId: string
  onAsignar: (materiaId: string, materiaNombre: string) => Promise<{ success: boolean; error?: string }>
}

export default function AsignarMateriaDialog({
  isOpen,
  onClose,
  docenteNombre,
  docenteId,
  onAsignar
}: AsignarMateriaDialogProps) {
  const [materiaId, setMateriaId] = useState('')
  const [materiaNombre, setMaterialNombre] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose()
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMateriaId('')
      setMaterialNombre('')
      setError('')
      setMensaje('')
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación de campos vacíos
    if (!materiaId.trim() || !materiaNombre.trim()) {
      setError('Todos los campos son obligatorios')
      return
    }

    setLoading(true)

    try {
      // Aquí se llamará a la función que conecta con la BD
      const result = await onAsignar(materiaId.trim(), materiaNombre.trim())

      if (result.success) {
        // Mostrar mensaje de éxito
        setMensaje('Materia asignada exitosamente')
        setMateriaId('')
        setMaterialNombre('')
        setError('')
        
        // Esperar un momento para mostrar el mensaje y luego recargar
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Mostrar error del servidor
        setError(result.error || 'Error al asignar la materia')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al asignar la materia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Información de la Materia
          </h2>
          <button 
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Información del docente */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Asignando materia a: <span className="font-medium text-gray-900 dark:text-gray-100">{docenteNombre}</span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* ID de la Materia */}
          <div className="mb-4">
            <label htmlFor="materiaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID de la Materia
            </label>
            <input
              id="materiaId"
              type="text"
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              placeholder="Ej: MAT001"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 
                dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Nombre de la Materia */}
          <div className="mb-4">
            <label htmlFor="materiaNombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Materia
            </label>
            <input
              id="materiaNombre"
              type="text"
              value={materiaNombre}
              onChange={(e) => setMaterialNombre(e.target.value)}
              placeholder="Ej: Matemática I"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 
                dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Criterios de asignación */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-blue-100 mb-1">
                  Criterios de asignación:
                </p>
                <ul className="text-xs text-gray-800 dark:text-blue-200 space-y-1">
                  <li>• Máximo 2 docentes por materia</li>
                  <li>• El ID y nombre deben coincidir</li>
                  <li>• Verificación automática de datos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {mensaje && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{mensaje}</span>
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="px-6 bg-black hover:bg-gray-800 text-white"
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
