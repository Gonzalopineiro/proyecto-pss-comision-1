'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Interfaz para representar una mesa de examen
 */
export interface MesaExamen {
  id: number
  materia_id: number
  docente_id: string
  fecha_examen: string
  hora_examen: string
  ubicacion: string
  estado: 'programada' | 'finalizada' | 'cancelada'
  comentarios?: string
  notas_cargadas: boolean
  created_at: string
  // Datos de la materia relacionada
  materia?: {
    id: number
    codigo_materia: string
    nombre: string
    descripcion?: string
    duracion?: string
  }
  // Datos del docente
  docente?: {
    id: string
    email: string
    nombre?: string
  }
}

/**
 * Obtiene todas las mesas de examen del docente logueado
 * 
 * @returns {Promise<{success: boolean, mesas?: MesaExamen[], error?: string}>}
 */
export async function obtenerMesasDocente(): Promise<{
  success: boolean
  mesas?: MesaExamen[]
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error al obtener usuario:', userError)
      return {
        success: false,
        error: 'No se pudo obtener la información del usuario'
      }
    }

    console.log('Buscando mesas para docente:', user.id, user.email)

    // Obtener las mesas del docente con información de la materia
    const { data: mesas, error: mesasError } = await supabase
      .from('mesas_examen')
      .select(`
        *,
        materias (
          id,
          codigo_materia,
          nombre,
          descripcion,
          duracion
        )
      `)
      .eq('docente_id', user.id)
      .order('fecha_examen', { ascending: false })

    if (mesasError) {
      console.error('Error al obtener mesas:', mesasError)
      return {
        success: false,
        error: `Error al obtener mesas de examen: ${mesasError.message}`
      }
    }

    // Transformar los datos para incluir la información de la materia
    const mesasConMateria: MesaExamen[] = mesas?.map(mesa => ({
      ...mesa,
      materia: mesa.materias ? {
        id: mesa.materias.id,
        codigo_materia: mesa.materias.codigo_materia,
        nombre: mesa.materias.nombre,
        descripcion: mesa.materias.descripcion,
        duracion: mesa.materias.duracion
      } : undefined
    })) || []

    console.log(`Encontradas ${mesasConMateria.length} mesas para el docente`)

    return {
      success: true,
      mesas: mesasConMateria
    }

  } catch (error) {
    console.error('Error en obtenerMesasDocente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Actualiza el estado de una mesa de examen
 * 
 * @param mesaId - ID de la mesa a actualizar
 * @param nuevoEstado - Nuevo estado de la mesa
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function actualizarEstadoMesa(
  mesaId: number, 
  nuevoEstado: 'programada' | 'finalizada' | 'cancelada'
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual para verificar que es el docente de la mesa
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'No se pudo obtener la información del usuario'
      }
    }

    // Actualizar el estado de la mesa
    const { error: updateError } = await supabase
      .from('mesas_examen')
      .update({ 
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', mesaId)
      .eq('docente_id', user.id) // Solo permitir al docente propietario

    if (updateError) {
      console.error('Error al actualizar estado de mesa:', updateError)
      return {
        success: false,
        error: `Error al actualizar la mesa: ${updateError.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Error en actualizarEstadoMesa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Marca las notas como cargadas para una mesa de examen
 * 
 * @param mesaId - ID de la mesa
 * @param notasCargadas - Si las notas están cargadas o no
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function marcarNotasCargadas(
  mesaId: number, 
  notasCargadas: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'No se pudo obtener la información del usuario'
      }
    }

    // Actualizar el estado de las notas
    const { error: updateError } = await supabase
      .from('mesas_examen')
      .update({ 
        notas_cargadas: notasCargadas,
        updated_at: new Date().toISOString()
      })
      .eq('id', mesaId)
      .eq('docente_id', user.id) // Solo permitir al docente propietario

    if (updateError) {
      console.error('Error al marcar notas:', updateError)
      return {
        success: false,
        error: `Error al marcar notas: ${updateError.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Error en marcarNotasCargadas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Elimina una mesa de examen (solo si está en estado 'programada')
 * 
 * @param mesaId - ID de la mesa a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function eliminarMesa(mesaId: number): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'No se pudo obtener la información del usuario'
      }
    }

    // Verificar que la mesa existe y pertenece al docente
    const { data: mesa, error: mesaError } = await supabase
      .from('mesas_examen')
      .select('estado')
      .eq('id', mesaId)
      .eq('docente_id', user.id)
      .single()

    if (mesaError || !mesa) {
      return {
        success: false,
        error: 'Mesa no encontrada o no tienes permisos'
      }
    }

    // Solo permitir eliminar mesas programadas
    if (mesa.estado !== 'programada') {
      return {
        success: false,
        error: 'Solo se pueden eliminar mesas en estado "programada"'
      }
    }

    // Eliminar la mesa
    const { error: deleteError } = await supabase
      .from('mesas_examen')
      .delete()
      .eq('id', mesaId)
      .eq('docente_id', user.id)

    if (deleteError) {
      console.error('Error al eliminar mesa:', deleteError)
      return {
        success: false,
        error: `Error al eliminar la mesa: ${deleteError.message}`
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Error en eliminarMesa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}