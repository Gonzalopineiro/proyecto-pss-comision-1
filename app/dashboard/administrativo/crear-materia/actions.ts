'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface MateriaData {
  id?: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
}

export async function checkMateriaExistente(nombre: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('materias')
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
      .from('materias')
      .insert([
        { 
          codigo_materia: data.codigo_materia, 
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
    .from('materias')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error al obtener las materias:', error)
    throw new Error('Error al cargar las materias')
  }
  
  return data || []
}

/**
 * Busca una única materia por su código exacto.
 * 
 * @param {string} codigoMateria - El código de la materia a buscar (ej: "MAT102")
 * @returns {Promise<MateriaData | null>} - Los datos de la materia encontrada o null si no existe.
 */
export async function buscarMateriaPorCodigo(codigoMateria: string): Promise<MateriaData | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('codigo_materia', codigoMateria)
      .single(); // Usamos .single() porque esperamos un único resultado o ninguno

    if (error) {
      // Si el error es 'PGRST116', significa que no se encontró ninguna fila, lo cual no es un error real.
      if (error.code !== 'PGRST116') {
        console.error('Error al buscar materia por código:', error);
      }
      return null;
    }
    
    return data;

  } catch (e) {
    console.error('Error inesperado al buscar materia:', e);
    return null;
  }
}