'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- TIPOS DE DATOS ---
// (Tu código SQL usa 'nota' y 'estado' (ej 'inscripto'), así que mantenemos los tipos de la última versión)

export interface MesaExamenDetalles {
  id: string
  materiaNombre: string
  materiaCodigo: string
  inscriptosCount: number
  estado: string
  fecha: string
}

export interface AlumnoInscripcion {
  inscripcionId: string
  alumnoId: string
  legajo: string
  nombreCompleto: string
  dni: string
  nota: number | null
  estado: 'inscripto' | 'presente' | 'ausente' | 'aprobado' | 'reprobado'
}

// --- ACCIONES DE BASE DE DATOS ---

export async function getDatosMesaExamen(idMesa: string): Promise<{
  detalles: MesaExamenDetalles,
  alumnos: AlumnoInscripcion[]
}> {
  const supabase = await createClient()

  try {
    // 1. Obtener detalles de la mesa (Esto no cambia)
    const { data: mesaData, error: mesaError } = await supabase
      .from('mesas_examen')
      .select(`
        id,
        estado,
        fecha_examen,
        materias ( nombre, codigo_materia ),
        inscripciones_mesa_examen ( count ) 
      `)
      .eq('id', idMesa)
      .single()

    if (mesaError || !mesaData) {
      console.error('Error al obtener mesa:', mesaError)
      throw new Error('No se pudo encontrar la mesa de examen.')
    }

    // 2. OBTENER ALUMNOS USANDO LA NUEVA FUNCIÓN RPC
    //    Esto reemplaza el .select() que fallaba
    const { data: alumnosData, error: alumnosError } = await supabase
      .rpc('get_alumnos_para_mesa', { p_mesa_id: idMesa })

    if (alumnosError) {
      console.error('Error al llamar RPC get_alumnos_para_mesa:', alumnosError)
      throw new Error('No se pudo cargar la lista de alumnos.')
    }

    // 3. Mapear los datos
    const detalles: MesaExamenDetalles = {
      id: mesaData.id,
      // @ts-ignore
      materiaNombre: mesaData.materias.nombre,
      // @ts-ignore
      materiaCodigo: mesaData.materias.codigo_materia,
      // @ts-ignore
      inscriptosCount: mesaData.inscripciones_mesa_examen[0]?.count || 0,
      estado: mesaData.estado,
      fecha: new Date(mesaData.fecha_examen).toLocaleDateString('es-ES'),
    }

    // Los datos de 'alumnosData' ya vienen en el formato correcto
    // gracias a nuestra función SQL.
    const alumnos = alumnosData as AlumnoInscripcion[]

    return { detalles, alumnos }

  } catch (error) {
    console.error('Error en getDatosMesaExamen:', (error as Error).message)
    throw new Error('No se pudo cargar la lista de alumnos.')
  }
}

/**
 * Actualiza el estado de 'presente'/'ausente' de un alumno
 */
export async function actualizarPresente(inscripcionId: string, estaPresente: boolean) {
  const supabase = await createClient()

  const nuevoEstado = estaPresente ? 'presente' : 'ausente'
  const nota = estaPresente ? undefined : null // Si está ausente, la nota se borra

  const { error } = await supabase
    .from('inscripciones_mesa_examen')
    .update({ estado: nuevoEstado, nota: nota })
    .eq('id', inscripcionId)

  if (error) return { success: false, error: error.message }
  return { success: true, newState: { estado: nuevoEstado, nota: null } }
}

/**
 * Guarda la nota de un alumno
 */
export async function guardarNota(inscripcionId: string, nota: number | null) {
  const supabase = await createClient()

  let nuevoEstado: AlumnoInscripcion['estado']
  if (nota === null) {
    nuevoEstado = 'presente'
  } else {
    nuevoEstado = nota >= 4 ? 'aprobado' : 'reprobado'
  }

  const { error } = await supabase
    .from('inscripciones_mesa_examen')
    .update({ nota, estado: nuevoEstado })
    .eq('id', inscripcionId)

  if (error) return { success: false, error: error.message }
  return { success: true, newState: { nota, estado: nuevoEstado } }
}

/**
 * Finaliza la carga.
 */
export async function finalizarCarga(idMesa: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mesas_examen')
    .update({ 
        estado: 'finalizada', // Tu estado es 'finalizada'
        notas_cargadas: true
    }) 
    .eq('id', idMesa)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/docente/mesas-examen/${idMesa}`)
  return { success: true }
}

/**
 * Publica las notas.
 */
export async function publicarNotas(idMesa: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mesas_examen')
    .update({ estado: 'finalizada' }) // Asumo 'finalizada' es el estado final
    .eq('id', idMesa)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/docente/mesas-examen/${idMesa}`)
  return { success: true }
}