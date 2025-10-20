'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Elimina la asociación entre una materia y un plan, junto con todas sus correlatividades
 * 
 * @param {number} planMateriaId - ID de la relación plan_materia a eliminar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function eliminarMateriaAsociada(
  planMateriaId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Primero, obtener el materia_id y plan_id para eliminar las correlatividades
    const { data: planMateria, error: fetchError } = await supabase
      .from('plan_materia')
      .select('materia_id, plan_id')
      .eq('id', planMateriaId)
      .single()
    
    if (fetchError || !planMateria) {
      console.error('Error al obtener la materia del plan:', fetchError)
      return { error: 'No se pudo encontrar la materia en el plan' }
    }
    
    // Eliminar correlatividades donde esta materia es correlativa de cursado
    const { error: errorCursado } = await supabase
      .from('correlatividades_cursado')
      .delete()
      .or(`materia_id.eq.${planMateria.materia_id},correlativa_id.eq.${planMateria.materia_id}`)
      .eq('plan_id', planMateria.plan_id)
    
    if (errorCursado) {
      console.error('Error al eliminar correlatividades de cursado:', errorCursado)
      // Continuamos aunque falle, ya que podría no tener correlatividades
    }
    
    // Eliminar correlatividades donde esta materia es correlativa de examen
    const { error: errorFinal } = await supabase
      .from('correlatividades_final')
      .delete()
      .or(`materia_id.eq.${planMateria.materia_id},correlativa_id.eq.${planMateria.materia_id}`)
      .eq('plan_id', planMateria.plan_id)
    
    if (errorFinal) {
      console.error('Error al eliminar correlatividades de final:', errorFinal)
      // Continuamos aunque falle, ya que podría no tener correlatividades
    }
    
    // Finalmente, eliminar la relación plan-materia
    const { error } = await supabase
      .from('plan_materia')
      .delete()
      .eq('id', planMateriaId)
    
    if (error) {
      console.error('Error al eliminar materia del plan:', error)
      return { error: `Error al eliminar materia del plan: ${error.message}` }
    }
    
    // Comentado para evitar revalidación durante el proceso de creación del plan
    // El componente manejará la actualización del estado localmente
    // revalidatePath('/dashboard/administrativo')
    
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al eliminar materia asociada:', e)
    return { error: 'Error inesperado al eliminar materia asociada' }
  }
}