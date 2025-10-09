'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Datos mock de carreras disponibles
const CARRERAS_DISPONIBLES = [
  { id: 1, nombre: 'Ingeniería en Sistemas' },
  { id: 2, nombre: 'Licenciatura en Administración' },
  { id: 3, nombre: 'Contaduría Pública' },
  { id: 4, nombre: 'Ingeniería Industrial' },
  { id: 5, nombre: 'Licenciatura en Marketing' },
  { id: 6, nombre: 'Ingeniería Civil' },
]

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

  // Función para generar contraseña automática
  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Función para generar ID automático
  const generateUserId = (): string => {
    return 'ALU-' + Date.now().toString()
  }

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
        return ''
      
      case 'dni':
        if (!value.trim()) {
          return 'Este campo es obligatorio'
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
        if (value.trim().length < 10) {
          return 'La dirección debe ser más específica'
        }
        return ''
      
      case 'telefono':
        if (value.trim() && !/^\d{10,12}$/.test(value.replace(/\s/g, ''))) {
          return 'El teléfono debe contener entre 10 y 12 dígitos'
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

    try {
      // Generar datos automáticos
      const userId = generateUserId()
      const password = generatePassword()
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const alumnoData = {
        ...formData,
        id: userId,
        password: password,
        rol: 'alumno',
        fechaCreacion: new Date().toISOString()
      }

      console.log('Datos del alumno creado:', alumnoData)
      
      setSuccessMessage(`¡Alumno registrado exitosamente! 
      ID: ${userId} 
      Contraseña inicial: ${password}
      El alumno puede iniciar sesión inmediatamente.`)
      
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.legajo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: LEG2025001"
                  />
                  <p className="text-xs text-gray-500 mt-1">Código único del alumno</p>
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.carreraId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccione una carrera</option>
                    {CARRERAS_DISPONIBLES.map(carrera => (
                      <option key={carrera.id} value={carrera.id}>
                        {carrera.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">El alumno será asociado a esta carrera</p>
                  {errors.carreraId && <p className="mt-1 text-sm text-red-600">{errors.carreraId}</p>}
                </div>
              </div>
            </div>

            {/* Información Automática */}
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
                    <p className="text-sm text-blue-600">Se generará automáticamente</p>
                    <p className="text-xs text-blue-500 mt-1">💡 La contraseña será enviada al email del alumno para su primer acceso</p>
                  </div>
                </div>
              </div>
            </div>

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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AltaUsuarioForm