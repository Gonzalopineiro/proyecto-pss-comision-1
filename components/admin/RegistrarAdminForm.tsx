"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { RefreshCcw, Info } from 'lucide-react' 

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors(prev => ({...prev, [e.target.name]: ''}))
    }
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&'
    const length = 12
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  function validate() {
    const e: {[k:string]:string} = {}
    if (!formData.nombre) e.nombre = 'El nombre es obligatorio'
    if (!formData.apellido) e.apellido = 'El apellido es obligatorio'
    if (!formData.dni) e.dni = 'El DNI es obligatorio'
    if (!formData.legajo) e.legajo = 'El legajo es obligatorio'
    if (!formData.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    if (!formData.email) e.email = 'El email es obligatorio'
    if (!formData.direccion) e.direccion = 'La dirección es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contrasenaTemporal: generatePassword(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setServerError(data?.error || 'Error al registrar el administrador')
        return
      }

      if (onCancel) {
        onCancel()
      } else {
        router.push('/dashboard/administrativo')
      }
    } catch (err) {
      setServerError('Error de red')
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
              className={`w-full mt-1 p-2 rounded border ${errors.dni ? 'border-red-500' : ''}`}
              placeholder="Ej: 12345678"
            />
            {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
          </div>
          <div>
            <label className="text-sm">Legajo *</label>
            <input
              type="text"
              name="legajo"
              value={formData.legajo}
              onChange={handleChange}
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
              className="w-full mt-1 p-2 rounded border"
              placeholder="Ej: +54 11 1234-5678"
            />
          </div>
          <div>
            <label className="text-sm">ID de Usuario</label>
            <input
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
              variant="primary-dark" 
              className="w-full py-3 rounded-2xl"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm">Contraseña Temporal</label>
          <div className="flex items-stretch mt-1">
            <input
              type="text"
              name="contrasenaTemporal"
              value={formData.contrasenaTemporal || 'Se generará automáticamente'}
              readOnly
              className="flex-grow p-2 rounded-l border bg-gray-50 text-slate-600"
            />
            <button
              type="button" 
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  contrasenaTemporal: generatePassword()
                }))
              }}
              className="flex-shrink-0 px-4 py-2 rounded-r border border-l-0 bg-gray-200 hover:bg-gray-300 text-slate-700 flex items-center justify-center"
            >
              <RefreshCcw className="w-4 h-4 mr-1 mt-px" />
              Generar
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            La contraseña cumple con: mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos
          </p>
        </div>

         <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-px" />
                <p className="font-medium">
                    El administrador quedará activo inmediatamente
                </p>
            </div>

      </form>
    </div>
  )
}