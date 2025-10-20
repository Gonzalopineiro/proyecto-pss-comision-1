"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { RefreshCcw, Info } from 'lucide-react'
import ConfirmationPopup from '@/components/ui/confirmation-popup'
// Las acciones se importarán dinámicamente para evitar problemas con 'use server' 

export default function RegistrarAdministrativoForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    legajo: '',
    fechaNacimiento: '',
    email: '',
    direccion: '',
    telefono: '',
    contrasenaTemporal: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[k:string]:string}>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // Validaciones en tiempo real
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
      case 'apellido':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
        }
        if (value.trim().length < 2) {
          return 'Debe tener al menos 2 caracteres'
        }
        // Verificar que no contenga números
        if (/\d/.test(value)) {
          return 'No puede contener números'
        }
        // Validación adicional para solo permitir letras, espacios y algunos caracteres especiales
        if (!/^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(value)) {
          return 'Solo puede contener letras y espacios'
        }
        return ''
      
      case 'dni':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
        }
        // Verificar que solo contenga dígitos (más estricto)
        if (/[^\d]/.test(value)) {
          return 'El DNI solo debe contener números'
        }
        if (!/^\d{7,8}$/.test(value)) {
          return 'El DNI debe tener 7 u 8 dígitos'
        }
        return ''
      
      case 'legajo':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
        }
        if (value.trim().length < 3) {
          return 'El legajo debe tener al menos 3 caracteres'
        }
        // Validación para formato de legajo (alfanumérico)
        if (!/^[A-Za-z0-9-]+$/.test(value)) {
          return 'El legajo solo puede contener letras, números y guiones'
        }
        return ''
      
      case 'fechaNacimiento':
        if (!value) {
          return 'Este campo es obligatorio'
        }
        const fechaNac = new Date(value)
        const hoy = new Date()
        const edad = hoy.getFullYear() - fechaNac.getFullYear()
        if (edad < 18 || edad > 100) {
          return 'La edad debe estar entre 18 y 100 años'
        }
        return ''
      
      case 'email':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Ingrese un email válido'
        }
        return ''
      
      case 'direccion':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
        }
        if (value.trim().length < 10) {
          return 'La dirección debe ser más específica'
        }
        // Verificar que contenga al menos un número (para la altura de la calle)
        if (!/\d/.test(value)) {
          return 'La dirección debe incluir altura (números)'
        }
        // Verificar caracteres válidos para una dirección
        if (!/^[A-Za-z0-9áéíóúÁÉÍÓÚüÜñÑ\s,.'-]+$/.test(value)) {
          return 'La dirección contiene caracteres no permitidos'
        }
        return ''
      
      case 'telefono':
        if (!value.trim()) {
          return '' // Campo opcional
        }
        // Verificar que solo contenga dígitos, espacios y algunos caracteres permitidos
        if (/[^\d\s+-]/.test(value)) {
          return 'El teléfono solo debe contener números y caracteres como + o -'
        }
        if (!/^\+?[\d-\s]{10,15}$/.test(value.replace(/\s/g, ''))) {
          return 'Ingrese un número de teléfono válido (10-15 dígitos)'
        }
        return ''
      
      default:
        return ''
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Validación en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&'
    const length = 12
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  function validate() {
    const e: {[k:string]:string} = {}
    
    // Usamos la función validateField para validar cada campo
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value as string)
      if (error) {
        e[key] = error
      }
    })
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const [passwordUsed, setPasswordUsed] = useState<string | null>(null)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setPasswordUsed(null)
    setRegistroExitoso(false)
    if (!validate()) return
    setLoading(true)

    try {
      // Importamos las funciones desde el archivo actions.ts
      const { registrarAdministrativo, verificarDuplicados } = await import('./actions')
      
      // Primero verificamos si el email o legajo ya existen
      const verificacion = await verificarDuplicados(formData.email, formData.legajo)
      if (verificacion.duplicado) {
        setServerError(verificacion.mensaje || 'Datos duplicados')
        if (verificacion.campo) {
          setErrors({...errors, [verificacion.campo as string]: verificacion.mensaje || 'Ya existe'})
        }
        setLoading(false)
        return
      }
      
      // Si no hay duplicados, procedemos con el registro
      // Nota: Ya no usamos la contraseña temporal, usamos el DNI como base
      const result = await registrarAdministrativo(formData)
      
      if (!result.success) {
        setServerError(result.error || 'Error al registrar el administrador')
        return
      }

      // Si hay contraseña devuelta, la mostramos
      if (result.passwordUsed) {
        setPasswordUsed(result.passwordUsed)
      }
      
      setRegistroExitoso(true)
      setShowPopup(true) // Mostrar el popup de confirmación
    } catch (err) {
      console.error('Error al registrar:', err)
      setServerError('Error inesperado al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Información del Nuevo Administrador</h1>
          <p className="text-sm text-slate-500">Complete todos los campos obligatorios marcados con *</p>
        </div>
        <div>
          {onCancel ? (
            <button type="button" className="text-sm text-slate-600 hover:underline" onClick={onCancel}>← Volver</button>
          ) : (
            <Link href="/dashboard/administrativo">
              <Button variant="outline">← Volver</Button>
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              pattern="[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s'-]+"
              title="Solo puede contener letras y espacios, sin números"
              className={`w-full mt-1 p-2 rounded border ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ingrese el nombre"
            />
            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label className="text-sm">Apellido *</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              pattern="[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s'-]+"
              title="Solo puede contener letras y espacios, sin números"
              className={`w-full mt-1 p-2 rounded border ${errors.apellido ? 'border-red-500' : ''}`}
              placeholder="Ingrese el apellido"
            />
            {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">DNI *</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              pattern="[0-9]{7,8}"
              inputMode="numeric"
              title="El DNI solo debe contener entre 7 y 8 dígitos numéricos"
              maxLength={8}
              className={`w-full mt-1 p-2 rounded border ${errors.dni ? 'border-red-500' : ''}`}
              placeholder="Ej: 12345678"
            />
            <p className="text-xs text-gray-500 mt-1">Solo números, sin puntos ni espacios</p>
            {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
          </div>
          <div>
            <label className="text-sm">Legajo *</label>
            <input
              type="text"
              name="legajo"
              value={formData.legajo}
              onChange={handleChange}
              pattern="[A-Za-z0-9-]+"
              title="El legajo solo puede contener letras, números y guiones"
              className={`w-full mt-1 p-2 rounded border ${errors.legajo ? 'border-red-500' : ''}`}
              placeholder="Número de legajo"
            />
            {errors.legajo && <p className="text-xs text-red-600 mt-1">{errors.legajo}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Fecha de Nacimiento *</label>
            <input
              title='Fecha de Nacimiento'
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className={`w-full mt-1 p-2 rounded border ${errors.fechaNacimiento ? 'border-red-500' : ''}`}
            />
            {errors.fechaNacimiento && <p className="text-xs text-red-600 mt-1">{errors.fechaNacimiento}</p>}
          </div>
          <div>
            <label className="text-sm">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full mt-1 p-2 rounded border ${errors.email ? 'border-red-500' : ''}`}
              placeholder="ejemplo@universidad.edu"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm">Dirección Completa *</label>
          <textarea
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className={`w-full mt-1 p-2 rounded border h-28 ${errors.direccion ? 'border-red-500' : ''}`}
            placeholder="Ingrese la dirección completa"
          />
          {errors.direccion && <p className="text-xs text-red-600 mt-1">{errors.direccion}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              pattern="[\d\s+\-]+"
              title="El teléfono solo debe contener números, espacios y los símbolos + o -"
              className={`w-full mt-1 p-2 rounded border ${errors.telefono ? 'border-red-500' : ''}`}
              placeholder="Ej: +54 11 1234-5678"
            />
            <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
            {errors.telefono && <p className="text-xs text-red-600 mt-1">{errors.telefono}</p>}
          </div>
          <div>
            <label className="text-sm">ID de Usuario</label>
            <input
              title='ID de Usuario'
              type="text"
              disabled
              className="w-full mt-1 p-2 rounded border bg-gray-50"
              value="Se generará automáticamente"
            />
          </div>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex items-center gap-3 mt-4">
          {onCancel ? (
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border">Cancelar</button>
          ) : (
            <Link href="/dashboard/administrativo">
              <Button variant="outline">Cancelar</Button>
            </Link>
          )}

          <div className="ml-auto w-48">
            <Button 
              type="submit" 
              variant="default" 
              className="w-full py-3 rounded-2xl"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </Button>
          </div>
        </div>

        {passwordUsed ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-bold text-green-700 mb-2">¡Administrador creado con éxito!</h3>
            <p className="text-green-800 mb-2">Se ha generado la siguiente contraseña temporal:</p>
            <div className="bg-white p-3 rounded border border-green-300 font-mono text-lg mb-2">
              {passwordUsed}
            </div>
            <p className="text-xs text-green-700">
              ⚠️ IMPORTANTE: Guarde esta contraseña en un lugar seguro. No se volverá a mostrar.
            </p>
          </div>
        ) : (
          <div>
            <label className="text-sm">Información de Contraseña</label>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                La contraseña inicial se generará automáticamente usando el DNI como base.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                El administrador deberá cambiar su contraseña en el primer inicio de sesión.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-px" />
          <p className="font-medium">
            {registroExitoso 
              ? "Administrador creado exitosamente. Redirigiendo..." 
              : "El administrador quedará activo inmediatamente"
            }
          </p>
        </div>

      </form>

      {/* Popup de confirmación */}
      <ConfirmationPopup
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false)
          // Redirigir después de cerrar el popup
          if (onCancel) {
            onCancel()
          } else {
            router.push('/dashboard/administrativo')
          }
        }}
        title="¡Administrador Registrado con Éxito!"
        message={`El administrador ${formData.nombre} ${formData.apellido} ha sido registrado correctamente en el sistema.`}
        passwordUsed={passwordUsed}
        userType="administrador"
      />
    </div>
  )
}