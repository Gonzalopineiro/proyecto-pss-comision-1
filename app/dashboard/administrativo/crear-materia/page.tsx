"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Duracion = 'Anual' | 'Cuatrimestral'

function generarCodigo(){
  const year = new Date().getFullYear()
  const rand = Math.floor(100 + Math.random() * 900)
  return `MAT-${year}-${rand}`
}

export default function CrearMateria(){
  const [codigo, setCodigo] = useState(generarCodigo())
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [duracion, setDuracion] = useState<Duracion | ''>('')
  const [errors, setErrors] = useState<{[k:string]:string}>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    // regenerar código cuando el componente monta
    setCodigo(generarCodigo())
  }, [])

  async function checkNombreUnique(name: string){
    if (!name) return
    try{
      const res = await fetch('/api/materias')
      const list = await res.json()
      const exists = list.find((m:any)=> m.nombre.toLowerCase() === name.toLowerCase())
      setErrors(prev=> ({...prev, nombre: exists ? 'El nombre de la materia ya existe' : ''}))
    }catch(e){
      // ignore
    }
  }

  function validate(){
    const e: {[k:string]:string} = {}
    if (!nombre || nombre.trim()==='') e.nombre = 'El nombre es obligatorio'
    if (!descripcion || descripcion.trim()==='') e.descripcion = 'La descripción es obligatoria'
    if (!duracion) e.duracion = 'La duración es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent){
    ev.preventDefault()
    setServerError(null)
    if (!validate()) return
    setLoading(true)
    try{
      const res = await fetch('/api/materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nombre, descripcion, duracion })
      })
      const data = await res.json()
      if (!res.ok){
        setServerError(data?.error || 'Error al crear materia')
        setLoading(false)
        return
      }
      // éxito: redirigir al panel o limpiar
      // por ahora redirigimos al panel administrativo
      window.location.href = '/dashboard/administrativo'
    }catch(err){
      setServerError('Error de red')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Crear Nueva Materia</h1>
            <p className="text-sm text-slate-500">Complete los campos obligatorios para registrar una nueva materia en el sistema</p>
          </div>
          <div>
            <Link href="/dashboard/administrativo">
              <Button variant="outline">← Volver</Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm">Código de Materia *</label>
            <input readOnly value={codigo} className="w-full mt-1 p-2 rounded border bg-gray-50" />
            <p className="text-xs text-slate-400 mt-1">Código generado automáticamente por el sistema</p>
          </div>

          <div>
            <label className="text-sm">Nombre de la Materia *</label>
            <input value={nombre} onChange={(e)=>{ setNombre(e.target.value); checkNombreUnique(e.target.value)}} className={`w-full mt-1 p-2 rounded border ${errors.nombre ? 'border-red-500' : ''}`} placeholder="Ingrese el nombre de la materia" />
            {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
          </div>

          <div>
            <label className="text-sm">Descripción *</label>
            <textarea value={descripcion} onChange={(e)=> setDescripcion(e.target.value)} className={`w-full mt-1 p-2 rounded border h-28 ${errors.descripcion ? 'border-red-500' : ''}`} placeholder="Describe los objetivos y contenido de la materia" />
            {errors.descripcion && <p className="text-xs text-red-600">{errors.descripcion}</p>}
          </div>

          <div>
            <label className="text-sm">Duración *</label>
            <select value={duracion} onChange={(e)=> setDuracion(e.target.value as Duracion)} className={`w-full mt-1 p-2 rounded border ${errors.duracion ? 'border-red-500' : ''}`}>
              <option value="">Seleccione la duración</option>
              <option value="Anual">Anual</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
            </select>
            {errors.duracion && <p className="text-xs text-red-600">{errors.duracion}</p>}
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <div className="flex items-center gap-3 mt-4">
            <Link href="/dashboard/administrativo">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <div className="ml-auto w-48">
              <Button type="submit" variant="primary-dark" className="w-full py-3 rounded-2xl" disabled={loading}>{loading ? 'Creando...' : 'Crear Materia'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
