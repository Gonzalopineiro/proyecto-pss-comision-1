'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Elimina la asociación entre una materia y un plan
 * 
 * @param {number} planMateriaId - ID de la relación plan_materia a eliminar
 * @returns {Promise<{ success: boolean } | { error: string }>} - Resultado de la operación
 */
export async function eliminarMateriaAsociada(
  planMateriaId: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Eliminar la relación plan-materia
    const { error } = await supabase
      .from('plan_materia')
      .delete()
      .eq('id', planMateriaId)
    
    if (error) {
      console.error('Error al eliminar materia del plan:', error)
      return { error: `Error al eliminar materia del plan: ${error.message}` }
    }
    
    revalidatePath('/dashboard/administrativo')
    return { success: true }
    
  } catch (e) {
    console.error('Error inesperado al eliminar materia asociada:', e)
    return { error: 'Error inesperado al eliminar materia asociada' }
  }
}