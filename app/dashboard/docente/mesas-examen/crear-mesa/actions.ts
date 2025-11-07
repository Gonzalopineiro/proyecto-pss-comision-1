'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Interfaz para los datos de la mesa de examen
 */
export interface MesaExamenData {
  materia_id: number
  fecha_examen: string
  hora_examen: string
  ubicacion: string
  comentarios?: string
}

/**
 * Interfaz para representar una materia
 */
export interface Materia {
  id: number
  codigo_materia: string
  nombre: string
  descripcion: string
  duracion: string
}

/**
 * Obtiene las materias asignadas al docente actual
 * 
 * @returns {Promise<Materia[]>} - Lista de materias del docente
 */
export async function obtenerMateriasDocente(): Promise<Materia[]> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    console.log('Usuario autenticado para materias:', user.id, user.email)

    // Obtener el docente_id desde la tabla docentes usando el email
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('email', user.email)
      .single()

    if (docenteError || !docenteData) {
      console.error('Error al obtener datos del docente:', docenteError)
      throw new Error('No se encontró el perfil de docente asociado a este usuario')
    }

    console.log('Docente encontrado:', docenteData.id)

    // Obtener solo las materias asignadas al docente mediante la tabla materia_docente
    const { data: materiasAsignadas, error } = await supabase
      .from('materia_docente')
      .select(`
        materia_id,
        materias:materia_id (
          id,
          codigo_materia,
          nombre,
          descripcion,
          duracion
        )
      `)
      .eq('docente_id', docenteData.id)

    if (error) {
      console.error('Error al obtener materias asignadas:', error)
      throw new Error('Error al cargar las materias asignadas')
    }

    console.log('Materias asignadas encontradas:', materiasAsignadas?.length || 0)

    if (!materiasAsignadas || materiasAsignadas.length === 0) {
      return []
    }

    // Procesar y formatear las materias
    const materias: Materia[] = materiasAsignadas
      .map((item) => {
        const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias;
        if (!materia) return null;
        
        return {
          id: materia.id,
          codigo_materia: materia.codigo_materia,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          duracion: materia.duracion
        };
      })
      .filter(Boolean) as Materia[]

    // Ordenar por nombre
    materias.sort((a, b) => a.nombre.localeCompare(b.nombre))

    return materias
  } catch (error) {
    console.error('Error en obtenerMateriasDocente:', error)
    return []
  }
}

/**
 * Crea una nueva mesa de examen
 * 
 * @param {MesaExamenData} data - Datos de la mesa de examen
 * @returns {Promise<{ success: boolean; error?: string }>} - Resultado de la operación
 */
export async function crearMesaExamen(data: MesaExamenData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'No se pudo obtener la información del usuario' }
    }

    // Validar que la fecha no sea en el pasado
    const fechaExamen = new Date(data.fecha_examen)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaExamen < hoy) {
      return { success: false, error: 'La fecha del examen no puede ser en el pasado' }
    }

    // Validar que la fecha no sea más de 6 meses en el futuro
    const seisMesesEnFuturo = new Date()
    seisMesesEnFuturo.setMonth(seisMesesEnFuturo.getMonth() + 6)
    seisMesesEnFuturo.setHours(23, 59, 59, 999)
    
    if (fechaExamen > seisMesesEnFuturo) {
      return { success: false, error: 'La fecha del examen no puede ser mayor a 6 meses en el futuro' }
    }

    // Crear la mesa de examen
    const { error: insertError } = await supabase
      .from('mesas_examen')
      .insert({
        materia_id: data.materia_id,
        docente_id: user.id,
        fecha_examen: data.fecha_examen,
        hora_examen: data.hora_examen,
        ubicacion: data.ubicacion,
        comentarios: data.comentarios || null,
        estado: 'programada',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error al crear mesa de examen:', insertError)
      return { success: false, error: 'Error al crear la mesa de examen' }
    }

    // Revalidar la página para mostrar los cambios
    revalidatePath('/dashboard/docente/mesas-examen')
    revalidatePath('/dashboard/docente')
    return { success: true }
  } catch (error) {
    console.error('Error en crearMesaExamen:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Verifica si ya existe una mesa de examen para la misma materia en la misma fecha y hora
 * 
 * @param {number} materiaId - ID de la materia
 * @param {string} fecha - Fecha del examen
 * @param {string} hora - Hora del examen
 * @returns {Promise<boolean>} - True si ya existe una mesa
 */
export async function verificarMesaExistente(
  materiaId: number, 
  fecha: string, 
  hora: string
): Promise<boolean> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('mesas_examen')
      .select('id')
      .eq('materia_id', materiaId)
      .eq('fecha_examen', fecha)
      .eq('hora_examen', hora)
      .limit(1)

    if (error) {
      console.error('Error al verificar mesa existente:', error)
      return false
    }

    return (data && data.length > 0)
  } catch (error) {
    console.error('Error en verificarMesaExistente:', error)
    return false
  }
}