"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { crearMateria, checkMateriaExistente } from './actions'
import ConfirmationPopup from '@/components/ui/confirmation-popup'

type Duracion = 'Anual' | 'Cuatrimestral'

function generarCodigo(){
  const year = new Date().getFullYear()
  const rand = Math.floor(100 + Math.random() * 900)
  return `MAT-${year}-${rand}`
}

export default function CrearMateriaForm({ onCancel }: { onCancel?: () => void }){
  const router = useRouter()
  const [codigo, setCodigo] = useState(generarCodigo())
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [duracion, setDuracion] = useState<Duracion | ''>('')
  const [errors, setErrors] = useState<{[k:string]:string}>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [materiaCreada, setMateriaCreada] = useState<{codigo: string, nombre: string} | null>(null)

  useEffect(()=>{
    setCodigo(generarCodigo())
  }, [])

  async function checkNombreUnique(name: string){
    if (!name || name.trim() === '') return
    try {
      const exists = await checkMateriaExistente(name)
      if (exists) {
        setErrors(prev => ({...prev, nombre: 'El nombre de la materia ya existe'}))
      } else {
        setErrors(prev => ({...prev, nombre: ''}))
      }
    } catch(e) {
      console.error('Error al verificar el nombre:', e)
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
    try {
      // Usamos la función del servidor para crear la materia
      const result = await crearMateria({
        codigo_materia: codigo,
        nombre,
        descripcion,
        duracion: duracion as Duracion
      })
      
      if (result.error) {
        setServerError(result.error)
        setLoading(false)
        return
      }
      
      // Si fue exitoso, guardar la información de la materia creada y mostrar el popup
      setMateriaCreada({
        codigo,
        nombre
      })
      setShowPopup(true)
      setLoading(false)
    } catch (err) {
      console.error('Error al crear materia:', err)
      setServerError('Error inesperado. Por favor, inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Crear Nueva Materia</h1>
          <p className="text-sm text-slate-500">Complete los campos obligatorios para registrar una nueva materia en el sistema</p>
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
        <div>
          <label className="text-sm">Código de Materia *</label>
          <input title="Código de Materia" readOnly value={codigo} className="w-full mt-1 p-2 rounded border bg-gray-50 dark:bg-slate-800" />
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
          <select title="Duración" value={duracion} onChange={(e)=> setDuracion(e.target.value as Duracion)} className={`w-full mt-1 p-2 rounded border ${errors.duracion ? 'border-red-500' : ''}`}>
            <option value="">Seleccione la duración</option>
            <option value="Anual">Anual</option>
            <option value="Cuatrimestral">Cuatrimestral</option>
          </select>
          {errors.duracion && <p className="text-xs text-red-600">{errors.duracion}</p>}
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
            <Button type="submit" variant="default" className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700" disabled={loading}>{loading ? 'Creando...' : 'Crear Materia'}</Button>
          </div>
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
            router.refresh() // Refrescar para mostrar los cambios
          }
        }}
        title="¡Materia Creada con Éxito!"
        message={materiaCreada ? `La materia "${materiaCreada.nombre}" (${materiaCreada.codigo}) ha sido registrada correctamente en el sistema.` : 'La materia ha sido registrada correctamente en el sistema.'}
      />
    </div>
  )
}