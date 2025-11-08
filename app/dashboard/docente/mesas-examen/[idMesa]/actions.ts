'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- TIPOS DE DATOS ---

export interface MesaExamenDetalles {
  id: string
  materiaNombre: string
  materiaCodigo: string
  inscriptosCount: number
  estado: string // 'programada', 'finalizada', 'cancelada'
  fecha: string
  carreraNombre: string
  docenteNombre: string | null
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

export interface Usuario {
  id: string
  nombre: string | null
  email: string
}

// --- ACCIONES DE BASE DE DATOS ---

export async function getDatosMesaExamen(idMesa: string): Promise<{
  detalles: MesaExamenDetalles,
  alumnos: AlumnoInscripcion[]
}> {
  const supabase = await createClient()

  try {
    // 1. Obtener detalles de la mesa
    // --- CORRECCIÓN DEFINITIVA ---
    // Hemos eliminado las uniones a 'carreras' y 'docente'
    // que estaban causando el fallo de la consulta.
    const { data: mesaData, error: mesaError } = await supabase
      .from('mesas_examen')
      .select(`
        id,
        estado,
        fecha_examen,
        materias (
          nombre,
          codigo_materia
        ),
        inscripciones_mesa_examen ( count )
      `)
      .eq('id', idMesa)
      .single()

    // Esta línea es la que falla. Ahora mesaError debería ser null
    if (mesaError || !mesaData) {
      console.error('Error al obtener mesa:', mesaError)
      throw new Error('No se pudo encontrar la mesa de examen.')
    }

    // 2. OBTENER ALUMNOS USANDO LA NUEVA FUNCIÓN RPC
    const { data: alumnosData, error: alumnosError } = await supabase
      .rpc('get_alumnos_para_mesa', { p_mesa_id: idMesa })

    if (alumnosError) {
      console.error('Error al llamar RPC get_alumnos_para_mesa:', alumnosError)
      throw new Error('No se pudo cargar la lista de alumnos.')
    }

    // 3. Mapear los datos
    const materia = mesaData.materias as unknown as {
      nombre: string;
      codigo_materia: string;
    } | null;

    const inscripciones = mesaData.inscripciones_mesa_examen as unknown as {
      count: number;
    }[];

    // --- CORRECCIÓN DEFINITIVA ---
    // Como no podemos obtener estos datos por ahora,
    // ponemos valores temporales para que la página funcione.
    const docenteNombre = 'No Asignado';
    const carreraNombre = 'N/A';

    const detalles: MesaExamenDetalles = {
      id: String(mesaData.id),
      materiaNombre: materia?.nombre || 'N/A',
      materiaCodigo: materia?.codigo_materia || 'N/A',
      carreraNombre: carreraNombre, // <- Valor temporal
      docenteNombre: docenteNombre, // <- Valor temporal
      inscriptosCount: inscripciones[0]?.count || 0,
      estado: mesaData.estado,
      fecha: new Date(mesaData.fecha_examen).toLocaleDateString('es-ES'),
    }

    const alumnos = alumnosData as unknown as AlumnoInscripcion[]

    return { detalles, alumnos }

  } catch (error) {
    console.error('Error en getDatosMesaExamen:', (error as Error).message)
    throw new Error('No se pudo cargar la lista de alumnos.')
  }
}

export async function actualizarPresente(inscripcionId: string, estaPresente: boolean): Promise<{ success: boolean, error?: string, newState?: { estado: AlumnoInscripcion['estado'], nota: number | null } }> {
  const supabase = await createClient()
  const nuevoEstado = estaPresente ? 'presente' : 'ausente'
  const nota = estaPresente ? undefined : null
  const { error } = await supabase
    .from('inscripciones_mesa_examen')
    .update({ estado: nuevoEstado, nota: nota })
    .eq('id', inscripcionId)
  if (error) return { success: false, error: error.message }
  return { success: true, newState: { estado: nuevoEstado, nota: null } }
}

export async function guardarNota(inscripcionId: string, nota: number | null): Promise<{ success: boolean, error?: string, newState?: { nota: number | null, estado: AlumnoInscripcion['estado'] } }> {
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

export async function finalizarCarga(idMesa: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mesas_examen')
    .update({
      estado: 'finalizada',
      notas_cargadas: true
    })
    .eq('id', idMesa)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/docente/mesas-examen/${idMesa}`)
  return { success: true }
}

export async function publicarNotas(idMesa: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mesas_examen')
    .update({ estado: 'finalizada' })
    .eq('id', idMesa)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/docente/mesas-examen/${idMesa}`)
  return { success: true }
}

export async function getUsuarioActual(): Promise<Usuario> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.error("No hay usuario autenticado:", error)
    return { id: '', nombre: 'Usuario no autenticado', email: '' }
  }

  const nombre = (user.user_metadata as { full_name?: string })?.full_name || user.email || null;

  return {
    id: user.id,
    nombre: nombre,
    email: user.email!
  }
}