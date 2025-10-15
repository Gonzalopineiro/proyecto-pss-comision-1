'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Tipo para los datos de correlatividad
 */
interface CorrelativaDatos {
  plan_id: number
  materia_id: number
  correlativa_id: number
}

/**
 * Añade una correlatividad de cursada entre dos materias
 * 
 * @param {CorrelativaDatos} datos - Datos de la correlatividad
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function agregarCorrelativaCursado(
  datos: CorrelativaDatos
): Promise<{ success: boolean } | { error: string }> {
  try {
    // Validar que no se esté intentando crear una correlatividad de una materia consigo misma
    if (datos.materia_id === datos.correlativa_id) {
      return { error: 'Una materia no puede ser correlativa de sí misma' }
    }

    const supabase = await createClient()
    
    // Verificar si la correlatividad ya existe
    const { data: existente, error: errorVerificacion } = await supabase
      .from('correlatividades_cursado')
      .select('id')
      .eq('plan_id', datos.plan_id)
      .eq('materia_id', datos.materia_id)
      .eq('correlativa_id', datos.correlativa_id)
      .maybeSingle()
    
    if (errorVerificacion) {
      console.error('Error al verificar correlatividad existente:', errorVerificacion)
      return { error: 'Error al verificar correlatividad existente' }
    }
    
    if (existente) {
      return { error: 'Esta correlatividad ya existe' }
    }
    
    // Insertar la correlatividad
    const { error } = await supabase
      .from('correlatividades_cursado')
      .insert({
        plan_id: datos.plan_id,
        materia_id: datos.materia_id,
        correlativa_id: datos.correlativa_id
      })
    
    if (error) {
      console.error('Error al añadir correlatividad de cursado:', error)
      return { error: `Error al añadir correlatividad de cursado: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al añadir correlatividad de cursado:', e)
    return { error: 'Error inesperado al añadir correlatividad de cursado' }
  }
}

/**
 * Añade una correlatividad de examen final entre dos materias
 * 
 * @param {CorrelativaDatos} datos - Datos de la correlatividad
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function agregarCorrelativaFinal(
  datos: CorrelativaDatos
): Promise<{ success: boolean } | { error: string }> {
  try {
    // Validar que no se esté intentando crear una correlatividad de una materia consigo misma
    if (datos.materia_id === datos.correlativa_id) {
      return { error: 'Una materia no puede ser correlativa de sí misma' }
    }

    const supabase = await createClient()
    
    // Verificar si la correlatividad ya existe
    const { data: existente, error: errorVerificacion } = await supabase
      .from('correlatividades_final')
      .select('id')
      .eq('plan_id', datos.plan_id)
      .eq('materia_id', datos.materia_id)
      .eq('correlativa_id', datos.correlativa_id)
      .maybeSingle()
    
    if (errorVerificacion) {
      console.error('Error al verificar correlatividad existente:', errorVerificacion)
      return { error: 'Error al verificar correlatividad existente' }
    }
    
    if (existente) {
      return { error: 'Esta correlatividad ya existe' }
    }
    
    // Insertar la correlatividad
    const { error } = await supabase
      .from('correlatividades_final')
      .insert({
        plan_id: datos.plan_id,
        materia_id: datos.materia_id,
        correlativa_id: datos.correlativa_id
      })
    
    if (error) {
      console.error('Error al añadir correlatividad de final:', error)
      return { error: `Error al añadir correlatividad de final: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al añadir correlatividad de final:', e)
    return { error: 'Error inesperado al añadir correlatividad de final' }
  }
}

/**
 * Elimina una correlatividad de cursado
 * 
 * @param {number} correlativaId - ID de la correlatividad a eliminar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function eliminarCorrelativaCursado(
  correlativaId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('correlatividades_cursado')
      .delete()
      .eq('id', correlativaId)
    
    if (error) {
      console.error('Error al eliminar correlatividad de cursado:', error)
      return { error: `Error al eliminar correlatividad de cursado: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al eliminar correlatividad de cursado:', e)
    return { error: 'Error inesperado al eliminar correlatividad de cursado' }
  }
}

/**
 * Elimina una correlatividad de examen final
 * 
 * @param {number} correlativaId - ID de la correlatividad a eliminar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function eliminarCorrelativaFinal(
  correlativaId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('correlatividades_final')
      .delete()
      .eq('id', correlativaId)
    
    if (error) {
      console.error('Error al eliminar correlatividad de final:', error)
      return { error: `Error al eliminar correlatividad de final: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al eliminar correlatividad de final:', e)
    return { error: 'Error inesperado al eliminar correlatividad de final' }
  }
}

/**
 * Obtiene todas las correlatividades de cursado para una materia específica
 * 
 * @param {number} planId - ID del plan de estudios
 * @param {number} materiaId - ID de la materia
 * @returns {Promise<Array<any> | null>} - Lista de correlatividades o null en caso de error
 */
export async function obtenerCorrelativasCursado(
  planId: number,
  materiaId: number
): Promise<Array<any> | null> {
  try {
    const supabase = await createClient()
    
    // Primero obtenemos las correlatividades
    const { data: correlativas, error: errorCorrelativas } = await supabase
      .from('correlatividades_cursado')
      .select('id, correlativa_id')
      .eq('plan_id', planId)
      .eq('materia_id', materiaId)
    
    if (errorCorrelativas) {
      console.error('Error al obtener correlatividades de cursado:', errorCorrelativas)
      return null
    }
    
    // Si no hay correlativas, devolvemos un array vacío
    if (!correlativas || correlativas.length === 0) {
      return []
    }
    
    // Luego obtenemos los datos de las materias correlativas
    const resultado = []
    
    for (const correlativa of correlativas) {
      const { data: materia, error: errorMateria } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('id', correlativa.correlativa_id)
        .single()
      
      if (errorMateria) {
        console.error('Error al obtener datos de materia:', errorMateria)
        continue
      }
      
      resultado.push({
        id: correlativa.id,
        correlativa_id: correlativa.correlativa_id,
        materias: materia
      })
    }
    
    return resultado
    
  } catch (e) {
    console.error('Error inesperado al obtener correlatividades de cursado:', e)
    return null
  }
}

/**
 * Obtiene todas las correlatividades de examen final para una materia específica
 * 
 * @param {number} planId - ID del plan de estudios
 * @param {number} materiaId - ID de la materia
 * @returns {Promise<Array<any> | null>} - Lista de correlatividades o null en caso de error
 */
export async function obtenerCorrelativasFinal(
  planId: number,
  materiaId: number
): Promise<Array<any> | null> {
  try {
    const supabase = await createClient()
    
    // Primero obtenemos las correlatividades
    const { data: correlativas, error: errorCorrelativas } = await supabase
      .from('correlatividades_final')
      .select('id, correlativa_id')
      .eq('plan_id', planId)
      .eq('materia_id', materiaId)
    
    if (errorCorrelativas) {
      console.error('Error al obtener correlatividades de final:', errorCorrelativas)
      return null
    }
    
    // Si no hay correlativas, devolvemos un array vacío
    if (!correlativas || correlativas.length === 0) {
      return []
    }
    
    // Luego obtenemos los datos de las materias correlativas
    const resultado = []
    
    for (const correlativa of correlativas) {
      const { data: materia, error: errorMateria } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('id', correlativa.correlativa_id)
        .single()
      
      if (errorMateria) {
        console.error('Error al obtener datos de materia:', errorMateria)
        continue
      }
      
      resultado.push({
        id: correlativa.id,
        correlativa_id: correlativa.correlativa_id,
        materias: materia
      })
    }
    
    return resultado
    
  } catch (e) {
    console.error('Error inesperado al obtener correlatividades de final:', e)
    return null
  }
}