'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

interface Carrera {
  id: number
  nombre: string
  codigo: string
}

interface FormData {
  nombre: string
  apellido: string
  dni: string
  legajo: string
  fechaNacimiento: string
  email: string
  direccion: string
  telefono: string
  carreraId: string
}

interface FormErrors {
  [key: string]: string
}

const AltaUsuarioForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    dni: '',
    legajo: '',
    fechaNacimiento: '',
    email: '',
    direccion: '',
    telefono: '',
    carreraId: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [passwordUsed, setPasswordUsed] = useState<string | null>(null)
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [carrerasLoading, setCarrerasLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)

  // Cargar carreras al iniciar
  useEffect(() => {
    async function loadCarreras() {
      try {
        const { obtenerCarreras } = await import('./actions')
        const data = await obtenerCarreras()
        if (data && Array.isArray(data)) {
          setCarreras(data)
        } else {
          setErrors(prev => ({ ...prev, general: 'Error al cargar las carreras disponibles' }))
        }
      } catch (error) {
        console.error('Error al cargar carreras:', error)
        setErrors(prev => ({ ...prev, general: 'No se pudieron cargar las carreras disponibles' }))
      } finally {
        setCarrerasLoading(false)
      }
    }

    loadCarreras()
  }, [])

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
        // Validación para no permitir números
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
        // Validación para formato de legajo (solo números)
        if (!/^\d+$/.test(value)) {
          return 'El legajo solo puede contener números'
        }
        return ''
      
      case 'fechaNacimiento':
        if (!value) {
          return 'Este campo es obligatorio'
        }
        const fechaNac = new Date(value)
        const hoy = new Date()
        const edad = hoy.getFullYear() - fechaNac.getFullYear()
        if (edad < 16 || edad > 100) {
          return 'La edad debe estar entre 16 y 100 años'
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
        if (value.trim().length < 5) {
          return 'La dirección debe tener al menos 5 caracteres'
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
      
      case 'carreraId':
        if (!value) {
          return 'Debe seleccionar una carrera'
        }
        return ''
      
      default:
        return ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validación en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) {
        newErrors[key] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    setPasswordUsed(null)

    try {
      // Importamos las funciones del servidor
      const { registrarAlumno, verificarDuplicados } = await import('./actions')
      
      // Verificamos si hay duplicados antes de continuar
      const verificacion = await verificarDuplicados(formData.email, formData.legajo, formData.dni)
      if (verificacion.duplicado) {
        setErrors({ 
          general: verificacion.mensaje || 'Datos duplicados',
          ...verificacion.campo ? { [verificacion.campo]: verificacion.mensaje || 'Ya existe' } : {}
        })
        setIsSubmitting(false)
        return
      }
      
      // Registrar el alumno
      const resultado = await registrarAlumno(formData)
      
      if (!resultado.success) {
        setErrors({ general: resultado.error || 'Error al registrar el alumno' })
        setIsSubmitting(false)
        return
      }

      // Si hay contraseña devuelta, la mostramos
      if (resultado.passwordUsed) {
        setPasswordUsed(resultado.passwordUsed)
      }
      
      setSuccessMessage(`¡Alumno ${formData.nombre} ${formData.apellido} registrado exitosamente!`)
      
      // Mostrar popup de confirmación
      setShowPopup(true)
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        legajo: '',
        fechaNacimiento: '',
        email: '',
        direccion: '',
        telefono: '',
        carreraId: ''
      })
      
    } catch (error) {
      console.error('Error al registrar alumno:', error)
      setErrors({ general: 'Error al registrar el alumno. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-6">
      <Card className="shadow-sm">          
        <CardContent className="p-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="text-green-800 whitespace-pre-line">
                {successMessage}
              </div>
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800">{errors.general}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información del Alumno */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Alumno</h3>
                <p className="text-sm text-gray-500 mt-1">Los campos marcados con * son obligatorios</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    pattern="[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s'-]+"
                    title="Solo puede contener letras y espacios, sin números"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese el nombre"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                </div>

                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    pattern="[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s'-]+"
                    title="Solo puede contener letras y espacios, sin números"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.apellido ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese el apellido"
                  />
                  {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                    DNI *
                  </label>
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    pattern="[0-9]{7,8}"
                    inputMode="numeric"
                    title="El DNI solo debe contener entre 7 y 8 dígitos numéricos"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dni ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 12345678"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo números, sin puntos ni espacios</p>
                  {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                </div>

                <div>
                  <label htmlFor="legajo" className="block text-sm font-medium text-gray-700 mb-2">
                    Legajo *
                  </label>
                  <input
                    type="text"
                    id="legajo"
                    name="legajo"
                    value={formData.legajo}
                    onChange={handleInputChange}
                    pattern="[0-9]+"
                    inputMode="numeric"
                    title="El legajo solo debe contener números"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.legajo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 2025001"
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo números, código único del alumno</p>
                  {errors.legajo && <p className="mt-1 text-sm text-red-600">{errors.legajo}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fechaNacimiento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="dd/mm/aaaa"
                  />
                  {errors.fechaNacimiento && <p className="mt-1 text-sm text-red-600">{errors.fechaNacimiento}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="alumno@ejemplo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se usará para el acceso al sistema</p>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección Completa *
                </label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.direccion ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Calle, número, ciudad, provincia, código postal"
                />
                {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    pattern="[\d\s+\-]+"
                    title="El teléfono solo debe contener números, espacios y los símbolos + o -"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.telefono ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: +54 11 1234-5678"
                  />
                  <p className="text-xs text-gray-500 mt-1">Campo opcional</p>
                  {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
                </div>

                <div>
                  <label htmlFor="carreraId" className="block text-sm font-medium text-gray-700 mb-2">
                    Carrera *
                  </label>
                  <select
                    id="carreraId"
                    name="carreraId"
                    value={formData.carreraId}
                    onChange={handleInputChange}
                    disabled={carrerasLoading}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.carreraId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccione una carrera</option>
                    {carreras.map(carrera => (
                      <option key={carrera.id} value={carrera.id}>
                        {carrera.nombre} ({carrera.codigo})
                      </option>
                    ))}
                  </select>
                  {carrerasLoading && <p className="text-xs text-blue-500 mt-1">Cargando carreras...</p>}
                  <p className="text-xs text-gray-500 mt-1">El alumno será asociado a esta carrera</p>
                  {errors.carreraId && <p className="mt-1 text-sm text-red-600">{errors.carreraId}</p>}
                </div>
              </div>
            </div>

            {passwordUsed ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-bold text-green-700 mb-2">¡Alumno registrado con éxito!</h3>
                <p className="text-green-800 mb-2">Se ha generado la siguiente contraseña inicial:</p>
                <div className="bg-white p-3 rounded border border-green-300 font-mono text-lg mb-2">
                  {passwordUsed}
                </div>
                <p className="text-xs text-green-700">
                  ⚠️ IMPORTANTE: Proporcione esta contraseña al alumno. El alumno deberá cambiarla en su primer inicio de sesión.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Información Generada Automáticamente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-blue-800">ID de Usuario</span>
                      <p className="text-sm text-blue-600">Se generará automáticamente</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-800">Contraseña Inicial</span>
                      <p className="text-sm text-blue-600">Se generará automáticamente usando el DNI del alumno</p>
                      <p className="text-xs text-blue-500 mt-1">💡 La contraseña se mostrará aquí después del registro exitoso</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="sm:order-1 px-8 py-3"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="sm:order-2 bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 flex items-center justify-center gap-2 sm:ml-auto"
              >
                <span className="text-lg">👤</span>
                {isSubmitting ? 'Registrando...' : 'Registrar Alumno'}
              </Button>
            </div>

            {/* Popup de confirmación - Movido aquí para mayor visibilidad */}
            <div className="mt-4">
              <ConfirmationPopup
                isOpen={showPopup}
                onClose={() => {
                  setShowPopup(false)
                  // Redirigir después de cerrar el popup
                  router.push('/dashboard/administrativo')
                }}
                title="¡Alumno Registrado con Éxito!"
                message={`El alumno ha sido registrado correctamente en la carrera seleccionada.`}
                passwordUsed={passwordUsed}
                userType="alumno"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AltaUsuarioForm