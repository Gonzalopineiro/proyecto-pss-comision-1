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
      console.error('Error al obtener usuario en crear mesa:', userError)
      throw new Error('No se pudo obtener la información del usuario')
    }

    console.log('Usuario autenticado en crear mesa:', user.id)

    // Obtener el docente_id desde la tabla docentes usando el email
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single()

    console.log('Datos del docente en crear mesa:', docenteData, 'Error:', docenteError)

    if (docenteError || !docenteData) {
      console.error('Error al obtener datos del docente:', docenteError)
      console.log('Intentando fallback con auth_user_id en crear mesa')
      
      // Buscar docente por email como fallback
      const { data: docentePorEmail } = await supabase
        .from('docentes')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!docentePorEmail) {
        console.log('No se encontró docente por email, devolviendo materias para debug')
        const { data: todasMaterias, error: errorTodas } = await supabase
          .from('materias')
          .select('id, codigo_materia, nombre, descripcion, duracion')
          .limit(3)

        return todasMaterias || []
      }

      const { data: materiasDirectas, error: errorDirecto } = await supabase
        .from('materia_docente')
        .select(`
          materias:materia_id (
            id,
            codigo_materia,
            nombre,
            descripcion,
            duracion
          )
        `)
        .eq('docente_id', docentePorEmail.id)

      console.log('Materias directas en crear mesa:', materiasDirectas, 'Error:', errorDirecto)

      if (errorDirecto || !materiasDirectas) {
        console.log('Fallback falló, devolviendo todas las materias para debug en crear mesa')
        // Último fallback: devolver todas las materias para debug
        const { data: todasMaterias, error: errorTodas } = await supabase
          .from('materias')
          .select('id, codigo_materia, nombre, descripcion, duracion')
          .limit(5)

        if (errorTodas || !todasMaterias) {
          return []
        }

        return todasMaterias
      }

      const materiasAsignadasDirectas = materiasDirectas.map(item => {
        const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias;
        return materia;
      }).filter(Boolean) as Materia[]
      
      return materiasAsignadasDirectas
    }

    // Obtener solo las materias asignadas al docente mediante la tabla materia_docente
    const { data: materias, error } = await supabase
      .from('materia_docente')
      .select(`
        materias:materia_id (
          id,
          codigo_materia,
          nombre,
          descripcion,
          duracion
        )
      `)
      .eq('docente_id', docenteData.id)

    console.log('Materias asignadas en crear mesa:', materias, 'Error:', error)

    if (error) {
      console.error('Error al obtener materias asignadas:', error)
      throw new Error('Error al cargar las materias asignadas')
    }

    // Mapear los datos para devolver el formato esperado
    const materiasAsignadas = materias?.map(item => {
      const materia = Array.isArray(item.materias) ? item.materias[0] : item.materias;
      return materia;
    }).filter(Boolean) || []
    
    console.log('Materias finales en crear mesa:', materiasAsignadas)
    return materiasAsignadas as Materia[]
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

    console.log('Creando mesa con auth user_id (docente_id):', user.id)

    // Validar que la fecha no sea en el pasado
    const [year, month, day] = data.fecha_examen.split('-')
    const fechaExamen = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaExamen < hoy) {
      return { success: false, error: 'La fecha del examen no puede ser en el pasado' }
    }

    // Crear la mesa de examen (docente_id debe ser auth.users.id)
    const { error: insertError } = await supabase
      .from('mesas_examen')
      .insert({
        materia_id: data.materia_id,
        docente_id: user.id, // Este debe ser auth.users.id según la foreign key
        fecha_examen: data.fecha_examen,
        hora_examen: data.hora_examen,
        ubicacion: data.ubicacion,
        comentarios: data.comentarios || null,
        estado: 'programada',
        created_at: new Date().toISOString()
      })

    console.log('Mesa creada, error:', insertError)

    if (insertError) {
      console.error('Error al crear mesa de examen:', insertError)
      return { success: false, error: 'Error al crear la mesa de examen' }
    }

    // Revalidar la página para mostrar los cambios
    revalidatePath('/dashboard/docente/mesas-examen')
    
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