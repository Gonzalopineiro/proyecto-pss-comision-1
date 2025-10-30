"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

interface User {
  id: string
  nombre: string
  apellido: string
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  dni?: number | null
  legajo?: number | null
  nacimiento?: string | null
}

interface ProfileEditorProps {
  user: User
  userRole: string
}

export default function ProfileEditor({ user, userRole }: ProfileEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [formData, setFormData] = useState({
    email: user.email || '',
    telefono: user.telefono || '',
    direccion: user.direccion || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSave = async () => {
    // Validar todos los campos
    const newErrors: Record<string, string> = {}
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)

    // Si hay errores, no enviar
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion
        })
      })

      const json = await res.json()
      if (json.success) {
        setIsEditing(false)
        setShowSuccessPopup(true)
      } else {
        alert('No se pudo actualizar: ' + (json.error || 'Error'))
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err)
      alert('Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Restaurar valores originales
    setFormData({
      email: user.email || '',
      telefono: user.telefono || '',
      direccion: user.direccion || ''
    })
    setErrors({})
    setIsEditing(false)
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'super': return 'Super Administrador'
      case 'docente': return 'Docente'
      case 'user': return 'Estudiante'
      default: return 'Usuario'
    }
  }

  return (
    <div className="space-y-6">
      {/* Información General (Solo lectura) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Información General
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">Solo lectura</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-500 dark:text-gray-400">Nombre Completo</Label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {user.nombre} {user.apellido}
            </p>
          </div>

          <div>
            <Label className="text-gray-500 dark:text-gray-400">Tipo de Usuario</Label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {getRoleDisplayName(userRole)}
            </p>
          </div>

          {user.dni && (
            <div>
              <Label className="text-gray-500 dark:text-gray-400">DNI</Label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.dni.toLocaleString()}
              </p>
            </div>
          )}

          {user.legajo && (
            <div>
              <Label className="text-gray-500 dark:text-gray-400">Legajo</Label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.legajo}
              </p>
            </div>
          )}

          {user.nacimiento && (
            <div>
              <Label className="text-gray-500 dark:text-gray-400">Fecha de Nacimiento</Label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {new Date(user.nacimiento).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Información Editable */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información de Contacto
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Modifica tus datos de contacto' : 'Tus datos de contacto actuales'}
            </p>
          </div>
          
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              ✏️ Editar
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              Correo Electrónico
              {isEditing && <span className="text-xs text-blue-600 dark:text-blue-400">✏️</span>}
            </Label>
            
            {isEditing ? (
              <>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  placeholder="tu.email@universidad.edu"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </>
            ) : (
              <p className="text-lg text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-slate-800 rounded">
                {user.email || 'No especificado'}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center gap-2">
              Teléfono
              {isEditing && <span className="text-xs text-gray-500">(opcional)</span>}
              {isEditing && <span className="text-xs text-blue-600 dark:text-blue-400">✏️</span>}
            </Label>
            
            {isEditing ? (
              <>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('telefono', e.target.value)}
                  placeholder="+56 9 8765 4321 (opcional)"
                  className={errors.telefono ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.telefono && (
                  <p className="text-sm text-red-500">{errors.telefono}</p>
                )}
              </>
            ) : (
              <p className="text-lg text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-slate-800 rounded">
                {user.telefono || 'No especificado'}
              </p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="flex items-center gap-2">
              Dirección
              {isEditing && <span className="text-xs text-blue-600 dark:text-blue-400">✏️</span>}
            </Label>
            
            {isEditing ? (
              <>
                <Input
                  id="direccion"
                  type="text"
                  value={formData.direccion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('direccion', e.target.value)}
                  placeholder="Av. Libertador 1234, Santiago, Región Metropolitana"
                  className={errors.direccion ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.direccion && (
                  <p className="text-sm text-red-500">{errors.direccion}</p>
                )}
              </>
            ) : (
              <p className="text-lg text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-slate-800 rounded">
                {user.direccion || 'No especificada'}
              </p>
            )}
          </div>

          {/* Botones de acción */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gray-800 hover:bg-gray-900"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}

          {/* Nota de auditoría */}
          {isEditing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                ℹ️ Los cambios serán registrados en el historial de auditoría
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Popup de confirmación de éxito */}
      <ConfirmationPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false)
          // Actualizar la página para mostrar los nuevos datos
          router.refresh()
        }}
        title="¡Perfil Actualizado con Éxito!"
        message="Tus datos han sido actualizados correctamente en el sistema."
      />
    </div>
  )
}