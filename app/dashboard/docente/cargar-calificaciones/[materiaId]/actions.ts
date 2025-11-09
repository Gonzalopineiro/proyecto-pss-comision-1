'use server'

import { createClient } from '@/utils/supabase/server'

interface InscriptoData {
  legajo: string
  nombre: string
  email: string
  estado: string
}

interface DatosCursada {
  materia: string
  codigo_materia: string
  anio: number
  cuatrimestre: number
  estado: string
  docente: string
  totalInscriptos: number
}

/**
 * Obtener datos básicos de la cursada para una materia específica del docente
 */
export async function obtenerDatosCursada(materiaId: string): Promise<{
  success: boolean
  data?: DatosCursada
  error?: string
  noData?: boolean
}> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Obteniendo datos de cursada para materia:', materiaId)
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    // Obtener docente actual
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id, nombre, apellido, email')
      .eq('email', user.email)
      .single()

    if (docenteError || !docenteData) {
      throw new Error('No se encontró información del docente')
    }

    console.log('👨‍🏫 Docente encontrado:', `${docenteData.nombre} ${docenteData.apellido}`)

    // Buscar relación materia-docente
    const { data: materiaDocenteData, error: materiaDocenteError } = await supabase
      .from('materia_docente')
      .select(`
        id,
        materias:materia_id (
          id, nombre, codigo_materia
        )
      `)
      .eq('materia_id', parseInt(materiaId))
      .eq('docente_id', docenteData.id)
      .single()

    if (materiaDocenteError || !materiaDocenteData) {
      throw new Error('El docente no está asignado a esta materia')
    }

    const materia = Array.isArray(materiaDocenteData.materias) 
      ? materiaDocenteData.materias[0] 
      : materiaDocenteData.materias

    console.log('📚 Materia encontrada:', materia?.nombre)

    // Buscar cursadas para este docente específico
    const { data: cursadaData, error: cursadaError } = await supabase
      .from('cursadas')
      .select('id, anio, cuatrimestre, estado')
      .eq('materia_docente_id', materiaDocenteData.id)
      .order('anio', { ascending: false })
      .order('cuatrimestre', { ascending: false })
      .limit(1)
      .single()

    if (cursadaError || !cursadaData) {
      // Debug: Mostrar qué cursadas existen en total para esta materia
      const { data: todasCursadas } = await supabase
        .from('cursadas')
        .select(`
          id, anio, cuatrimestre, estado, materia_docente_id,
          materia_docente:materia_docente_id (
            docentes:docente_id (
              nombre, apellido
            )
          )
        `)
        .eq('materia_docente_id', materiaDocenteData.id)

      console.log('📅 Cursadas existentes para este docente:', todasCursadas?.map(c => 
        `${c.anio}-${c.cuatrimestre} (${c.estado})`
      ) || 'ninguna')

      // Si no hay cursadas para este docente, ver si hay de otros docentes
      const { data: cursadasOtrosDocentes } = await supabase
        .from('cursadas')
        .select(`
          id, anio, cuatrimestre, estado, materia_docente_id,
          materia_docente:materia_docente_id (
            docentes:docente_id (
              nombre, apellido
            )
          )
        `)
        .in('materia_docente_id', [21, 58, 62]) // IDs conocidos para Análisis 1

      console.log('📅 Cursadas de otros docentes para Análisis 1:', cursadasOtrosDocentes?.map(c => {
        const materiaDocente = Array.isArray(c.materia_docente) 
          ? c.materia_docente[0] 
          : c.materia_docente
        const docente = materiaDocente?.docentes 
          ? (Array.isArray(materiaDocente.docentes) ? materiaDocente.docentes[0] : materiaDocente.docentes)
          : null
        return `${c.anio}-${c.cuatrimestre} (${c.estado}) - Docente: ${docente?.nombre || 'Sin nombre'} ${docente?.apellido || ''}`
      }) || 'ninguna')

      return {
        success: false,
        data: undefined,
        error: 'Esta materia no está asignada a ninguna cursada. Para poder cargar calificaciones, es necesario crear una cursada primero.',
        noData: true
      }
    }

    console.log('✅ Cursada encontrada:', `${cursadaData.anio}-${cursadaData.cuatrimestre} (${cursadaData.estado})`)

    // Contar inscriptos
    const { data: inscripcionesData, error: inscripcionesError } = await supabase
      .from('inscripciones_cursada')
      .select('id')
      .eq('cursada_id', cursadaData.id)

    const totalInscriptos = inscripcionesData?.length || 0

    return {
      success: true,
      data: {
        materia: materia?.nombre || 'Sin nombre',
        codigo_materia: materia?.codigo_materia || 'Sin código',
        anio: cursadaData.anio,
        cuatrimestre: cursadaData.cuatrimestre,
        estado: cursadaData.estado,
        docente: `${docenteData.nombre} ${docenteData.apellido}`,
        totalInscriptos
      }
    }

  } catch (error) {
    console.error('❌ Error en obtenerDatosCursada:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Obtener lista de inscriptos para una materia específica del docente
 */
export async function obtenerInscriptosCursada(materiaId: string): Promise<{
  success: boolean
  inscriptos: InscriptoData[]
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Obteniendo inscriptos para materia:', materiaId)
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    // Obtener docente actual
    const { data: docenteData, error: docenteError } = await supabase
      .from('docentes')
      .select('id')
      .eq('email', user.email)
      .single()

    if (docenteError || !docenteData) {
      throw new Error('No se encontró información del docente')
    }

    // Buscar relación materia-docente
    const { data: materiaDocenteData, error: materiaDocenteError } = await supabase
      .from('materia_docente')
      .select('id')
      .eq('materia_id', parseInt(materiaId))
      .eq('docente_id', docenteData.id)
      .single()

    if (materiaDocenteError || !materiaDocenteData) {
      throw new Error('El docente no está asignado a esta materia')
    }

    // Buscar cursada más reciente
    const { data: cursadaData, error: cursadaError } = await supabase
      .from('cursadas')
      .select('id, estado')
      .eq('materia_docente_id', materiaDocenteData.id)
      .order('anio', { ascending: false })
      .order('cuatrimestre', { ascending: false })
      .limit(1)
      .single()

    if (cursadaError || !cursadaData) {
      return {
        success: true,
        inscriptos: []
      }
    }

    console.log('✅ Cursada encontrada:', cursadaData.id)

    // MÉTODO DIRECTO: Obtener inscripciones y luego buscar usuarios paso a paso
    const { data: inscripcionesData, error: inscripcionesError } = await supabase
      .from('inscripciones_cursada')
      .select('alumno_id, estado, fecha_inscripcion')
      .eq('cursada_id', cursadaData.id)

    if (inscripcionesError) {
      throw new Error('Error al obtener inscripciones: ' + inscripcionesError.message)
    }

    console.log('📋 Inscripciones encontradas:', inscripcionesData?.length || 0)
    console.log('📋 UUIDs de alumnos:', inscripcionesData?.map(i => i.alumno_id))
    
    if (!inscripcionesData || inscripcionesData.length === 0) {
      return {
        success: true,
        inscriptos: []
      }
    }

    // Para cada inscripción, buscar el usuario
    const inscriptos: InscriptoData[] = []
    
    for (const inscripcion of inscripcionesData) {
      console.log(`🔍 Buscando usuario para UUID: ${inscripcion.alumno_id}`)
      
      // Buscar en Roles por UUID
      const { data: rolData, error: rolError } = await supabase
        .from('Roles')
        .select('legajo, email, user_id')
        .eq('user_id', inscripcion.alumno_id)
        .single()

      console.log(`🔗 Rol encontrado:`, rolData, rolError?.message)
      
      let usuario = null
      
      if (!rolError && rolData && rolData.legajo) {
        // Buscar usuario por legajo
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('legajo, nombre, apellido, email, dni')
          .eq('legajo', rolData.legajo)
          .single()

        console.log(`👤 Usuario encontrado por legajo ${rolData.legajo}:`, usuarioData, usuarioError?.message)
        
        if (!usuarioError && usuarioData) {
          usuario = usuarioData
        }
      }
      
      // Preparar datos finales
      const legajo = usuario?.legajo?.toString() || 'Sin legajo'
      const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Sin datos'
      const email = usuario?.email || rolData?.email || 'Sin email'
      
      const estadoFinal = cursadaData.estado === 'activa' 
        ? inscripcion.estado 
        : `${inscripcion.estado} (Cursada: ${cursadaData.estado})`

      inscriptos.push({
        legajo,
        nombre,
        email,
        estado: estadoFinal
      })

      console.log(`✅ Inscripto procesado:`, { legajo, nombre, email, estado: estadoFinal })
    }

    console.log(`🎉 Total inscriptos procesados: ${inscriptos.length}`)
    return {
      success: true,
      inscriptos
    }

  } catch (error) {
    console.error('❌ Error en obtenerInscriptosCursada:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return {
      success: false,
      inscriptos: [],
      error: errorMessage
    }
  }
}