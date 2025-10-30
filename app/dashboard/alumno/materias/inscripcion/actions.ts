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
  console.log('🚀 INICIANDO verificarCorrelativasCursado para materia ID:', materiaId)
  
  const supabase = await createClient()
  
  try {
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || !user.email) {
      console.error('❌ Error de autenticación:', authError)
      throw new Error('No hay sesión activa')
    }

    console.log('👤 Usuario autenticado:', user.email, 'ID:', user.id)

    // Opción 1: Intentar usar la función SQL
    try {
      console.log('🔧 Intentando función SQL verificar_correlativas_simple...')
      const { data, error } = await supabase.rpc('verificar_correlativas_simple', {
        p_email: user.email,
        p_materia_id: materiaId
      })
      
      if (!error && data) {
        console.log('✅ Función SQL exitosa, resultado:', data)
        return data as VerificacionCorrelativas
      } else {
        console.log('⚠️ Función SQL falló, error:', error)
      }
    } catch (sqlError) {
      console.log('❌ Error con función SQL, usando verificación TypeScript:', sqlError)
    }

    // Opción 2: Fallback - Verificación en TypeScript
    console.log('🔄 Usando verificación TypeScript como fallback...')
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
  
  console.log(`🔍 INICIANDO VERIFICACIÓN DE CORRELATIVAS`)
  console.log(`📧 Email: ${email}`)
  console.log(`👤 User ID: ${userId}`)
  console.log(`📚 Materia ID: ${materiaId}`)
  
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
    console.error('❌ Error obteniendo datos del alumno:', alumnoError)
    throw new Error('No se encontró el alumno o su carrera')
  }

  const planId = alumnoData.carreras.plan_de_estudio_id
  console.log(`📋 Plan de estudios ID: ${planId}`)

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
    console.error('❌ Error obteniendo correlativas:', correlativasError)
    throw new Error('Error al obtener correlativas requeridas')
  }

  console.log(`📊 Correlativas requeridas encontradas:`, correlativasRequeridas)

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
      console.log(`🔍 Verificando correlativa: ${correlativa.materias?.nombre} (ID: ${correlativa.correlativa_id})`)
      
      // Primero obtener las cursadas de esta materia específica
      const { data: cursadasMateria, error: cursadasError } = await supabase
        .from('cursadas')
        .select(`
          id,
          materia_docente!inner (
            materia_id
          )
        `)
        .eq('materia_docente.materia_id', correlativa.correlativa_id)

      if (cursadasError) {
        console.error('Error obteniendo cursadas:', cursadasError)
        return {
          materia_id: correlativa.correlativa_id,
          nombre: correlativa.materias?.nombre || 'Materia desconocida',
          codigo: correlativa.materias?.codigo_materia || 'Sin código',
          cumplida: false
        }
      }

      console.log(`📚 Cursadas encontradas para materia ${correlativa.correlativa_id}:`, cursadasMateria)

      // Si no hay cursadas de esta materia, no puede estar cumplida
      if (!cursadasMateria || cursadasMateria.length === 0) {
        console.log(`❌ No hay cursadas para la materia ${correlativa.materias?.nombre}`)
        return {
          materia_id: correlativa.correlativa_id,
          nombre: correlativa.materias?.nombre || 'Materia desconocida',
          codigo: correlativa.materias?.codigo_materia || 'Sin código',
          cumplida: false
        }
      }

      // Ahora verificar si el alumno está inscrito en alguna de esas cursadas con estado aprobado
      const cursadaIds = cursadasMateria.map((c: any) => c.id)
      
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones_cursada')
        .select('estado, cursada_id')
        .eq('alumno_id', userId)
        .in('cursada_id', cursadaIds)
        .in('estado', ['regular', 'aprobada'])

      if (inscripcionesError) {
        console.error('Error obteniendo inscripciones:', inscripcionesError)
      }

      console.log(`📝 Inscripciones del alumno en cursadas de ${correlativa.materias?.nombre}:`, inscripciones)

      const cumplida = inscripciones && inscripciones.length > 0

      console.log(`${cumplida ? '✅' : '❌'} Correlativa ${correlativa.materias?.nombre}: ${cumplida ? 'CUMPLIDA' : 'NO CUMPLIDA'}`)

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