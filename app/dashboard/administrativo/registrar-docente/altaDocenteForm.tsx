'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

interface Materia {
  id: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
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
  materias: number[]
}

interface FormErrors {
  [key: string]: string
}

const AltaDocenteForm = () => {
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
    materias: []
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [passwordUsed, setPasswordUsed] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [materias, setMaterias] = useState<Materia[]>([])
  const [materiasLoading, setMateriasLoading] = useState(true)
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<Materia[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showMateriasList, setShowMateriasList] = useState(false)

  // Cargar materias al iniciar
  useEffect(() => {
    async function loadMaterias() {
      try {
        const { obtenerMaterias } = await import('./actions')
        const data = await obtenerMaterias()
        if (data && Array.isArray(data)) {
          setMaterias(data)
        } else {
          setErrors(prev => ({ ...prev, general: 'Error al cargar las materias disponibles' }))
        }
      } catch (error) {
        console.error('Error al cargar materias:', error)
        setErrors(prev => ({ ...prev, general: 'No se pudieron cargar las materias disponibles' }))
      } finally {
        setMateriasLoading(false)
      }
    }

    loadMaterias()
  }, [])

  // Cerrar lista de materias cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showMateriasList) {
        const target = event.target as Element
        if (!target.closest('.materias-container')) {
          setShowMateriasList(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMateriasList])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validación en tiempo real
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  // Funciones para manejar materias
  const materiasDisponibles = materias.filter(materia => 
    materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    materia.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(materia => !materiasSeleccionadas.some(sel => sel.id === materia.id))

  const agregarMateria = (materia: Materia) => {
    setMateriasSeleccionadas(prev => [...prev, materia])
    setFormData(prev => ({ ...prev, materias: [...prev.materias, materia.id] }))
    setSearchTerm('')
    setShowMateriasList(false)
  }

  const removerMateria = (materiaId: number) => {
    setMateriasSeleccionadas(prev => prev.filter(m => m.id !== materiaId))
    setFormData(prev => ({ ...prev, materias: prev.materias.filter(id => id !== materiaId) }))
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
      const { registrarDocente, verificarDuplicadosDocente } = await import('./actions')
      
      // Verificamos si hay duplicados antes de continuar
      const verificacion = await verificarDuplicadosDocente(formData.email, formData.legajo, formData.dni)
      if (verificacion.duplicado) {
        setErrors({ 
          general: verificacion.mensaje || 'Datos duplicados',
          ...verificacion.campo ? { [verificacion.campo]: verificacion.mensaje || 'Ya existe' } : {}
        })
        setIsSubmitting(false)
        return
      }
      
      // Registrar el docente
      const resultado = await registrarDocente(formData)
      
      if (!resultado.success) {
        setErrors({ general: resultado.error || 'Error al registrar el docente' })
        setIsSubmitting(false)
        return
      }

      // Si hay contraseña devuelta, la mostramos
      if (resultado.passwordUsed) {
        setPasswordUsed(resultado.passwordUsed)
      }
      
      setSuccessMessage(`¡Docente ${formData.nombre} ${formData.apellido} registrado exitosamente!`)
      
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
        materias: []
      })
      setMateriasSeleccionadas([])
      
    } catch (error) {
      console.error('Error al registrar docente:', error)
      setErrors({ general: 'Error al registrar el docente. Intente nuevamente.' })
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
            {/* Información del Docente */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Docente</h3>
                <p className="text-sm text-gray-500 mt-1">Complete todos los campos obligatorios marcados con *</p>
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
                  <p className="text-xs text-gray-500 mt-1">Solo números, código único del docente</p>
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
                    placeholder="docente@ejemplo.com"
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

              {/* Sección de materias */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Información de Contacto y Académica</h4>
                  <p className="text-sm text-gray-500 mt-1">Seleccione las materias que dictará el docente</p>
                </div>

                <div>
                  <label htmlFor="materia-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Materia *
                  </label>
                  <div className="relative materias-container">
                    <input
                      type="text"
                      id="materia-search"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowMateriasList(e.target.value.length > 0)
                      }}
                      onFocus={() => setShowMateriasList(searchTerm.length > 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Buscar materia por nombre o código..."
                      disabled={materiasLoading}
                    />
                    {materiasLoading && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Lista desplegable de materias */}
                    {showMateriasList && materiasDisponibles.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {materiasDisponibles.slice(0, 10).map((materia) => (
                          <div
                            key={materia.id}
                            onClick={() => agregarMateria(materia)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {materia.codigo_materia} - {materia.nombre}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {materia.descripcion}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Duración: {materia.duracion}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {showMateriasList && searchTerm.length > 0 && materiasDisponibles.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                        <p className="text-gray-500 text-center">No se encontraron materias</p>
                      </div>
                    )}
                  </div>
                  {materiasLoading && <p className="text-xs text-blue-500 mt-1">Cargando materias...</p>}
                </div>

                {/* Materias seleccionadas */}
                {materiasSeleccionadas.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Materias seleccionadas ({materiasSeleccionadas.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {materiasSeleccionadas.map((materia) => (
                        <div
                          key={materia.id}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-blue-900">
                              {materia.codigo_materia} - {materia.nombre}
                            </div>
                            <div className="text-sm text-blue-700">
                              Duración: {materia.duracion}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerMateria(materia.id)}
                            className="ml-3 text-red-600 hover:text-red-800 focus:outline-none"
                            title="Remover materia"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información de acceso */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Información de Acceso</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <ul className="list-disc space-y-1 pl-5">
                          <li>El ID se generará automáticamente</li>
                          <li>La contraseña temporal se generará automáticamente</li>
                        </ul>
                        <p className="mt-2 text-xs">
                          La contraseña se generará usando el DNI del docente y se mostrará después del registro exitoso.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {passwordUsed ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-bold text-green-700 mb-2">¡Docente registrado con éxito!</h3>
                <p className="text-green-800 mb-2">Se ha generado la siguiente contraseña inicial:</p>
                <div className="bg-white p-3 rounded border border-green-300 font-mono text-lg mb-2">
                  {passwordUsed}
                </div>
                <p className="text-xs text-green-700">
                  ⚠️ IMPORTANTE: Proporcione esta contraseña al docente. El docente deberá cambiarla en su primer inicio de sesión.
                </p>
              </div>
            ) : null}

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
                <span className="text-lg">🎓</span>
                {isSubmitting ? 'Registrando...' : 'Dar de Alta Docente'}
              </Button>
            </div>
          </form>
          
          {/* Popup de confirmación */}
          <ConfirmationPopup
            isOpen={showPopup}
            onClose={() => {
              setShowPopup(false)
              // Redirigir después de cerrar el popup
              router.push('/dashboard/administrativo')
            }}
            title="¡Docente Registrado con Éxito!"
            message={`El docente ha sido registrado correctamente en el sistema.`}
            passwordUsed={passwordUsed}
            userType="docente"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AltaDocenteForm