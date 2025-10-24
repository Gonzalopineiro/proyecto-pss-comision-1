'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AdminData {
  id: string
  nombre?: string
  apellido?: string
  dni?: number | string | null
  legajo?: number | string | null
  nacimiento?: string | null
  email?: string | null
  direccion?: string | null
  telefono?: string | null
  created_at?: string | null
  createdAt?: string | null
  fecha_ingreso?: string | null
}

export default function ModificarAdminForm({ initialData }: { initialData: AdminData }) {
  const router = useRouter()
  const [email, setEmail] = useState(initialData.email || '')
  const [telefono, setTelefono] = useState(initialData.telefono || '')
  const [direccion, setDireccion] = useState(initialData.direccion || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({})

  // Helpers to format dates nicely for display
  const formatDateOnly = (val?: string | null) => {
    if (!val) return '-'
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('es-AR')
    } catch (e) {
      return '-'
    }
  }

  const formatDateTime = (val?: string | null) => {
    if (!val) return '-'
    try {
      const d = new Date(val)
      if (isNaN(d.getTime())) return '-'
      const date = d.toLocaleDateString('es-AR')
      const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      return `${date} ${time}`
    } catch (e) {
      return '-'
    }
  }

  const createdAtRaw = initialData.created_at || initialData.createdAt || initialData.fecha_ingreso
  const createdAt = createdAtRaw ? formatDateTime(createdAtRaw) : '-'
  const nacimiento = initialData.nacimiento ? formatDateOnly(initialData.nacimiento) : '-'

  // Validation matching registrarAdminForm.tsx rules for email, direccion and telefono
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email': {
        if (!value.trim()) return 'Este campo es obligatorio'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Ingrese un email válido'
        return ''
      }

      case 'direccion': {
        if (!value.trim()) return 'Este campo es obligatorio'
        if (value.trim().length < 10) return 'La dirección debe ser más específica'
        if (!/\d/.test(value)) return 'La dirección debe incluir altura (números)'
        if (!/^[A-Za-z0-9áéíóúÁÉÍÓÚüÜñÑ\s,.'-]+$/.test(value)) return 'La dirección contiene caracteres no permitidos'
        return ''
      }

      case 'telefono': {
        if (!value.trim()) return '' // optional
        if (/[^\d\s+-]/.test(value)) return 'El teléfono solo debe contener números y caracteres como + o -'
        if (!/^\+?[\d-\s]{10,15}$/.test(value.replace(/\s/g, ''))) return 'Ingrese un número de teléfono válido (10-15 dígitos)'
        return ''
      }

      default:
        return ''
    }
  }

  const handleEmailChange = (v: string) => {
    setEmail(v)
    const e = validateField('email', v)
    setFieldErrors((prev) => ({ ...prev, email: e }))
  }

  const handleTelefonoChange = (v: string) => {
    setTelefono(v)
    const e = validateField('telefono', v)
    setFieldErrors((prev) => ({ ...prev, telefono: e }))
  }

  const handleDireccionChange = (v: string) => {
    setDireccion(v)
    const e = validateField('direccion', v)
    setFieldErrors((prev) => ({ ...prev, direccion: e }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validar todos los campos usando las mismas reglas
    const emailError = validateField('email', email)
    const direccionError = validateField('direccion', direccion)
    const telefonoError = validateField('telefono', telefono)
    
    // Actualizar los errores de campos
    const errors = {
      email: emailError,
      direccion: direccionError,
      telefono: telefonoError
    }
    setFieldErrors(errors)
    
    // Si hay algún error, no enviar el formulario
    if (emailError || direccionError || (telefono && telefonoError)) {
      setError('Por favor, corrija los errores antes de continuar')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/administrativos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialData.id, email, telefono, direccion })
      })
      const json = await res.json()
      if (json.success) {
        try {
          // Notify the grid page to show the confirmation popup after redirect
          const payload = JSON.stringify({ 
            type: 'modified', 
            name: `${initialData.nombre} ${initialData.apellido}` 
          })
          localStorage.setItem('adminSuccess', payload)
        } catch (e) {
          // ignore storage errors
        }
        router.push('/dashboard/administrativo/grillas/administrativos')
      } else {
        setError(json.error || 'Error al actualizar')
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Modificar Administrativo</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded">
            <h3 className="font-medium mb-2">Datos (solo lectura)</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Nombre:</strong> {initialData.nombre} {initialData.apellido}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Legajo:</strong> {initialData.legajo ?? '-'}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Fecha de nacimiento:</strong> {initialData.nacimiento ?? '-'}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>DNI:</strong> {initialData.dni ?? '-'}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300"><strong>Fecha de ingreso:</strong> {createdAt ?? '-'}</div>
          </div>

          <div className="p-4">
            <h3 className="font-medium mb-2">Datos editables</h3>
            <div className="mb-3">
              <label className="text-sm">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} className="w-full mt-1 p-2 rounded border" />
              {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="mb-3">
              <label className="text-sm">Teléfono</label>
              <input type="text" value={telefono} onChange={(e) => handleTelefonoChange(e.target.value)} className="w-full mt-1 p-2 rounded border" />
              {fieldErrors.telefono && <p className="text-xs text-red-600 mt-1">{fieldErrors.telefono}</p>}
            </div>

            <div className="mb-3">
              <label className="text-sm">Dirección</label>
              <textarea value={direccion} onChange={(e) => handleDireccionChange(e.target.value)} className="w-full mt-1 p-2 rounded border h-24" />
              {fieldErrors.direccion && <p className="text-xs text-red-600 mt-1">{fieldErrors.direccion}</p>}
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
      </form>
    </Card>
  )
}
