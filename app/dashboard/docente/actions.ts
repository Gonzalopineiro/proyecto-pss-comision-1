'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Interfaz para representar una materia con estudiantes
 */
export interface MateriaDocente {
  id: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
  carrera?: string
  anio?: string
  estudiantes_inscriptos: number
}

/**
 * Interfaz para representar una mesa de examen
 */
export interface MesaExamen {
  id: number
  materia_id: number
  fecha_examen: string
  hora_examen: string
  ubicacion: string
  estado: string
  materia: {
    codigo_materia: string
    nombre: string
  }
}

/**
 * Obtiene las materias asignadas al docente con conteo de estudiantes
 */
export async function obtenerMateriasDocente(): Promise<MateriaDocente[]> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    // Por ahora, obtenemos todas las materias disponibles
    // En una implementación real, deberíamos filtrar por las materias asignadas al docente
    const { data: materias, error } = await supabase
      .from('materias')
      .select('id, codigo_materia, nombre, descripcion, duracion')
      .order('nombre')

    if (error) {
      console.error('Error al obtener materias:', error)
      return []
    }

    // Simular conteo de estudiantes inscriptos (en una implementación real, esto vendría de una tabla de inscripciones)
    const materiasConEstudiantes: MateriaDocente[] = (materias || []).map((materia, index) => ({
      ...materia,
      carrera: 'Ingeniería',
      anio: '1er Año',
      estudiantes_inscriptos: Math.floor(Math.random() * 50) + 25 // Simulación temporal
    }))

    return materiasConEstudiantes
  } catch (error) {
    console.error('Error en obtenerMateriasDocente:', error)
    return []
  }
}

/**
 * Obtiene las mesas de examen del docente
 */
export async function obtenerMesasExamenDocente(): Promise<MesaExamen[]> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    const { data: mesas, error } = await supabase
      .from('mesas_examen')
      .select(`
        id,
        materia_id,
        fecha_examen,
        hora_examen,
        ubicacion,
        estado,
        materias:materia_id (
          codigo_materia,
          nombre
        )
      `)
      .eq('docente_id', user.id)
      .order('fecha_examen', { ascending: true })

    if (error) {
      console.error('Error al obtener mesas de examen:', error)
      return []
    }

    // Transformar los datos para que coincidan con la interfaz
    return (mesas || []).map((mesa: any) => ({
      id: mesa.id,
      materia_id: mesa.materia_id,
      fecha_examen: mesa.fecha_examen,
      hora_examen: mesa.hora_examen,
      ubicacion: mesa.ubicacion,
      estado: mesa.estado,
      materia: {
        codigo_materia: mesa.materias?.codigo_materia || '',
        nombre: mesa.materias?.nombre || ''
      }
    }))
  } catch (error) {
    console.error('Error en obtenerMesasExamenDocente:', error)
    return []
  }
}

/**
 * Elimina (da de baja) una mesa de examen
 */
export async function eliminarMesaExamen(mesaId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'No se pudo obtener la información del usuario' }
    }

    // Verificar que la mesa pertenece al docente
    const { data: mesa, error: mesaError } = await supabase
      .from('mesas_examen')
      .select('docente_id')
      .eq('id', mesaId)
      .single()

    if (mesaError || !mesa) {
      return { success: false, error: 'Mesa de examen no encontrada' }
    }

    if (mesa.docente_id !== user.id) {
      return { success: false, error: 'No tiene permisos para eliminar esta mesa' }
    }

    // Eliminar la mesa de examen
    const { error: deleteError } = await supabase
      .from('mesas_examen')
      .delete()
      .eq('id', mesaId)

    if (deleteError) {
      console.error('Error al eliminar mesa de examen:', deleteError)
      return { success: false, error: 'Error al eliminar la mesa de examen' }
    }

    // Revalidar la página para mostrar los cambios
    revalidatePath('/dashboard/docente')
    revalidatePath('/dashboard/docente/mesas-examen')

    return { success: true }
  } catch (error) {
    console.error('Error en eliminarMesaExamen:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}