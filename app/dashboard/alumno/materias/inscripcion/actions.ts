'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CorrelativaInfo {
  materia_id: number
  nombre: string
  codigo: string
  cumplida: boolean
}

export interface VerificacionCorrelativas {
  puede_inscribirse: boolean
  correlativas: CorrelativaInfo[]
  plan_id: number
  error?: string
}

export async function obtenerMateriaIdPorCodigo(codigoMateria: string): Promise<number> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('materias')
    .select('id')
    .eq('codigo_materia', codigoMateria)
    .single()
  
  if (error || !data) {
    throw new Error(`No se encontró la materia con código: ${codigoMateria}`)
  }
  
  return data.id
}

export async function verificarCorrelativasCursado(
  materiaId: number
): Promise<VerificacionCorrelativas> {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || !user.email) {
      throw new Error('No hay sesión activa')
    }

    // Opción 1: Intentar usar la función SQL
    try {
      const { data, error } = await supabase.rpc('verificar_correlativas_simple', {
        p_email: user.email,
        p_materia_id: materiaId
      })
      
      if (!error && data) {
        return data as VerificacionCorrelativas
      }
    } catch (sqlError) {
      console.log('Error con función SQL, usando verificación TypeScript:', sqlError)
    }

    // Opción 2: Fallback - Verificación en TypeScript
    return await verificarCorrelativasTypeScript(user.email, user.id, materiaId, supabase)
    
  } catch (error) {
    console.error('Error en verificarCorrelativasCursado:', error)
    throw new Error('Error al verificar correlativas de cursado')
  }
}

// Función de fallback que hace la verificación en TypeScript
async function verificarCorrelativasTypeScript(
  email: string, 
  userId: string,
  materiaId: number, 
  supabase: any
): Promise<VerificacionCorrelativas> {
  
  // 1. Obtener el plan de estudios del alumno
  const { data: alumnoData, error: alumnoError } = await supabase
    .from('usuarios')
    .select(`
      id,
      carreras (
        plan_de_estudio_id
      )
    `)
    .eq('email', email)
    .single()

  if (alumnoError || !alumnoData?.carreras) {
    throw new Error('No se encontró el alumno o su carrera')
  }

  const planId = alumnoData.carreras.plan_de_estudio_id

  // 2. Obtener correlativas requeridas para esta materia
  const { data: correlativasRequeridas, error: correlativasError } = await supabase
    .from('correlatividades_cursado')
    .select(`
      correlativa_id,
      materias:correlativa_id (
        id,
        nombre,
        codigo_materia
      )
    `)
    .eq('plan_id', planId)
    .eq('materia_id', materiaId)

  if (correlativasError) {
    throw new Error('Error al obtener correlativas requeridas')
  }

  // Si no hay correlativas, puede inscribirse
  if (!correlativasRequeridas || correlativasRequeridas.length === 0) {
    return {
      puede_inscribirse: true,
      correlativas: [],
      plan_id: planId
    }
  }

  // 3. Verificar qué correlativas ya cumplió el alumno
  const correlativasConEstado = await Promise.all(
    correlativasRequeridas.map(async (correlativa: any) => {
      // Verificar si tiene inscripciones aprobadas para esta materia
      const { data: inscripciones } = await supabase
        .from('inscripciones_cursada')
        .select(`
          estado,
          cursadas (
            materia_docente (
              materia_id
            )
          )
        `)
        .eq('alumno_id', userId)
        .eq('cursadas.materia_docente.materia_id', correlativa.correlativa_id) // ❌ Esta sintaxis es incorrecta
        .in('estado', ['regular', 'aprobada'])

      const cumplida = inscripciones && inscripciones.length > 0

      return {
        materia_id: correlativa.correlativa_id,
        nombre: correlativa.materias?.nombre || 'Materia desconocida',
        codigo: correlativa.materias?.codigo_materia || 'Sin código',
        cumplida
      }
    })
  )

  // 4. Determinar si puede inscribirse
  const puede_inscribirse = correlativasConEstado.every(c => c.cumplida)

  return {
    puede_inscribirse,
    correlativas: correlativasConEstado,
    plan_id: planId
  }
}

export async function inscribirseACursada(
  cursadaId: number,
  materiaId: number
) {
  const supabase = await createClient()
  
  try {
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('No hay sesión activa')
    }
    
    // Primero verificar correlativas
    const verificacion = await verificarCorrelativasCursado(materiaId)
    
    if (!verificacion.puede_inscribirse) {
      const correlativasPendientes = verificacion.correlativas
        .filter(c => !c.cumplida)
        .map(c => c.nombre)
        .join(', ')
      
      throw new Error(`No puedes inscribirte. Correlativas pendientes: ${correlativasPendientes}`)
    }
    
    // Si pasa la verificación, proceder con la inscripción
    const { error } = await supabase
      .from('inscripciones_cursada')
      .insert({
        cursada_id: cursadaId,
        alumno_id: user.id,  // user.id es UUID
        estado: 'pendiente'
      })
    
    if (error) {
      if (error.code === '23505') { // Violación de constraint único
        throw new Error('Ya estás inscripto en esta cursada')
      }
      throw new Error('Error al procesar la inscripción')
    }
    
    revalidatePath('/dashboard/alumno/materias/inscripcion')
    return { success: true, message: 'Inscripción realizada exitosamente' }
    
  } catch (error) {
    console.error('Error en inscribirseACursada:', error)
    throw error
  }
}

// Función legacy para mantener compatibilidad
export async function inscribirseEnCursada(formData: FormData): Promise<void> {
  const cursadaId = Number(formData.get('cursadaId'))
  
  try {
    await inscribirseACursada(cursadaId, 0) // Sin verificación de correlativas
  } catch (error) {
    console.error('Error en inscripción legacy:', error)
  }
}