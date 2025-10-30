"use client"

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

interface EditUserModalProps {
  isOpen: boolean
  user: {
    id: string
    nombre: string
    apellido: string
    email?: string | null
    telefono?: string | null
    direccion?: string | null
  } | null
  onClose: () => void
  onSave: (data: { email: string; telefono: string; direccion: string }) => void
  loading?: boolean
  userType?: 'estudiante' | 'administrativo' | 'docente'
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  loading = false,
  userType = 'estudiante'
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    direccion: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getUserTypeDisplayName = (type: string) => {
    switch (type) {
      case 'estudiante':
        return 'Estudiante'
      case 'administrativo':
        return 'Administrativo'
      case 'docente':
        return 'Docente'
      default:
        return 'Estudiante'
    }
  }

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      console.log('📋 EditUserModal - Usuario recibido:', user)
      console.log('📋 EditUserModal - Email:', user.email)
      console.log('📋 EditUserModal - Telefono:', user.telefono)
      console.log('📋 EditUserModal - Direccion:', user.direccion)
      setFormData({
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      })
      setErrors({})
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'El email es obligatorio'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Email inválido'
        return ''
      case 'telefono':
        // Teléfono es opcional, pero si se ingresa debe ser válido
        if (value.trim() && value.trim().length < 8) {
          return 'El teléfono debe tener al menos 8 dígitos'
        }
        return ''
      case 'direccion':
        if (!value.trim()) return 'La dirección es obligatoria'
        if (value.trim().length < 5) return 'La dirección debe tener al menos 5 caracteres'
        return ''
      default:
        return ''
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validar en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar todos los campos
    const newErrors: Record<string, string> = {}
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)

    // Si hay errores, no enviar
    if (Object.keys(newErrors).length > 0) return

    onSave(formData)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 lg:p-8"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-600">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Modificar Usuario
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {user.nombre} {user.apellido}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2 flex-shrink-0"
            disabled={loading}
          >
            <X size={16} />
          </Button>
        </div>

        {/* Información de solo lectura */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Información General (Solo Lectura)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-500 dark:text-gray-400">Nombre Completo</Label>
              <p className="font-medium text-gray-900 dark:text-white break-words">{user.nombre} {user.apellido}</p>
            </div>
            <div>
              <Label className="text-gray-500 dark:text-gray-400">Tipo de Usuario</Label>
              <p className="font-medium text-gray-900 dark:text-white">{getUserTypeDisplayName(userType)}</p>
            </div>
          </div>
        </div>

        {/* Formulario editable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">✏️ Campos modificables</span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm sm:text-base">
              Correo Electrónico ✏️
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
              placeholder="juan.perez@universidad.edu"
              className={`text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
            <p className="text-xs text-gray-500 break-words">
              Este será el correo principal para comunicaciones
            </p>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center gap-2 text-sm sm:text-base">
              Teléfono ✏️ <span className="text-xs text-gray-500">(opcional)</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('telefono', e.target.value)}
              placeholder="+56 9 8765 4321 (opcional)"
              className={`text-sm sm:text-base ${errors.telefono ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.telefono && (
              <p className="text-sm text-red-500">{errors.telefono}</p>
            )}
            <p className="text-xs text-gray-500 break-words">
              Campo opcional. Incluye código de país si es necesario
            </p>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="flex items-center gap-2 text-sm sm:text-base">
              Dirección ✏️
            </Label>
            <Input
              id="direccion"
              type="text"
              value={formData.direccion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('direccion', e.target.value)}
              placeholder="Av. Libertador 1234, Depto 56, Santiago, Región Metropolitana"
              className={`text-sm sm:text-base ${errors.direccion ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.direccion && (
              <p className="text-sm text-red-500">{errors.direccion}</p>
            )}
            <p className="text-xs text-gray-500 break-words">
              Incluye calle, número, comuna y región
            </p>
          </div>

          {/* Nota de auditoría */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 flex items-start sm:items-center gap-2 break-words">
              <span className="flex-shrink-0">ℹ️</span>
              <span>Los cambios serán registrados en el historial de auditoría</span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-sm sm:text-base py-2 sm:py-2"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}