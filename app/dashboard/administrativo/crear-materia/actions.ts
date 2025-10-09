'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface MateriaData {
  codigo: string
  nombre: string
  descripcion: string
  duracion: 'Anual' | 'Cuatrimestral'
}

export async function checkMateriaExistente(nombre: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('materia')
    .select('id')
    .ilike('nombre', nombre)
    .maybeSingle()
  
  if (error) {
    console.error('Error al verificar materia existente:', error)
    throw new Error('Error al verificar si la materia ya existe')
  }
  
  return !!data
}

export async function crearMateria(data: MateriaData) {
  const supabase = await createClient()
  
  // Validaciones del servidor
  if (!data.nombre || data.nombre.trim() === '') {
    return { error: 'El nombre de la materia es obligatorio' }
  }
  
  if (!data.descripcion || data.descripcion.trim() === '') {
    return { error: 'La descripción de la materia es obligatoria' }
  }
  
  if (!data.duracion) {
    return { error: 'La duración de la materia es obligatoria' }
  }
  
  // Verificar si ya existe una materia con el mismo nombre
  try {
    const existente = await checkMateriaExistente(data.nombre)
    if (existente) {
      return { error: 'Ya existe una materia con este nombre' }
    }
  } catch (error) {
    return { error: 'Error al verificar la existencia de la materia' }
  }
  
  // Insertar en la base de datos
  try {
    const { data: newMateria, error } = await supabase
      .from('materia')
      .insert([
        { 
          codigio: data.codigo, // Nota: hay un error de escritura en la columna de la tabla
          nombre: data.nombre,
          descripcion: data.descripcion,
          duracion: data.duracion
        }
      ])
      .select()
    
    if (error) {
      console.error('Error al crear la materia:', error)
      return { error: 'Error al crear la materia en la base de datos' }
    }
    
    // Invalidar la caché para reflejar los cambios
    revalidatePath('/dashboard/administrativo')
    
    return { success: true, data: newMateria }
  } catch (error) {
    console.error('Error inesperado al crear la materia:', error)
    return { error: 'Ocurrió un error inesperado al crear la materia' }
  }
}

export async function obtenerMaterias() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('materia')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error al obtener las materias:', error)
    throw new Error('Error al cargar las materias')
  }
  
  return data || []
}